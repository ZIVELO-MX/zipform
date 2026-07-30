import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { deepStrictEqual, equal } from "node:assert/strict";

const runId = `${process.pid}-${Date.now()}`;
const postgresName = `tloz-container-content-pg-${runId}`;
const mongoName = `tloz-container-content-mongo-${runId}`;
const started = [];

class PocError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "PocError";
    this.code = code;
  }
}

function main() {
  try {
    assertDocker();
    startPostgres();
    startMongo();
    waitForPostgres();
    waitForMongo();

    const postgresVersion = postgres(
      "SELECT current_setting('server_version');",
    ).trim();
    const mongoVersion = mongo(
      "print(db.version());",
    ).trim();

    const postgresStartedAt = performance.now();
    postgres(postgresSchema);
    postgres(postgresSeed);
    const postgresFirst = postgresSummary();
    postgres(postgresSeed);
    const postgresSecond = postgresSummary();
    const postgresCutoverMs = performance.now() - postgresStartedAt;

    const mongoStartedAt = performance.now();
    mongo(mongoSchema);
    mongo(mongoSeed);
    const mongoFirst = mongoSummary();
    mongo(mongoSeed);
    const mongoSecond = mongoSummary();
    const mongoCutoverMs = performance.now() - mongoStartedAt;

    deepStrictEqual(postgresFirst, mongoFirst);
    deepStrictEqual(postgresSecond, postgresFirst);
    deepStrictEqual(mongoSecond, mongoFirst);
    equal(checksum(postgresFirst), checksum(mongoFirst));

    const postgresFailures = parseJsonOutput(postgres(postgresFailureChecks));
    const mongoFailures = parseJsonOutput(mongo(mongoFailureChecks));
    deepStrictEqual(postgresFailures, {
      invalidReference: "STORE_REFERENCE_INVALID",
      revisionConflict: "STORE_REVISION_CONFLICT",
    });
    deepStrictEqual(mongoFailures, postgresFailures);

    postgres(postgresSeed);
    mongo(mongoSeed);
    equal(checksum(postgresSummary()), checksum(postgresFirst));
    equal(checksum(mongoSummary()), checksum(mongoFirst));

    const postgresPerformance = parseJsonOutput(postgres(postgresBenchmark));
    const mongoPerformance = parseJsonOutput(mongo(mongoBenchmark));
    const baselineP95Ms = postgresPerformance.legacyP95Ms;
    const maximumP95Ms = baselineP95Ms * 1.2;

    const report = {
      engines: {
        postgres: postgresVersion,
        mongo: mongoVersion,
      },
      conformance: {
        parity: true,
        checksum: checksum(postgresFirst),
        containers: postgresFirst.containers.length,
        contents: postgresFirst.contents.length,
        typedFailureParity: true,
      },
      migration: {
        idempotent: true,
        rollbackVerified: true,
        postgresCutoverMs: round(postgresCutoverMs),
        mongoCutoverMs: round(mongoCutoverMs),
        readOnlyWindowBudgetMs: 900_000,
      },
      performance: {
        workload: "5000 records; filter status, sort updatedAt, limit 50; 250 samples",
        legacyPostgresP95Ms: baselineP95Ms,
        jsonbPostgresP95Ms: postgresPerformance.containerContentP95Ms,
        mongoP95Ms: mongoPerformance.containerContentP95Ms,
        maximumAllowedP95Ms: round(maximumP95Ms),
        jsonbWithinGate: postgresPerformance.containerContentP95Ms <= maximumP95Ms,
        mongoWithinGate: mongoPerformance.containerContentP95Ms <= maximumP95Ms,
      },
      integrity: {
        postgresContainerReference: "foreign-key",
        mongoContainerReference: "application-check",
        optimisticRevision: true,
      },
    };

    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    if (error instanceof PocError) {
      console.error(`${error.code}: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  } finally {
    for (const name of started.reverse()) {
      docker(["rm", "--force", name], undefined, true);
    }
  }
}

function assertDocker() {
  const result = docker(["version", "--format", "{{.Server.Version}}"], undefined, true);
  if (result.status !== 0) {
    throw new PocError("POC_DOCKER_UNAVAILABLE", "Docker no está disponible.");
  }
}

function startPostgres() {
  runDocker([
    "run",
    "--detach",
    "--name",
    postgresName,
    "--env",
    "POSTGRES_PASSWORD=tloz-poc",
    "--env",
    "POSTGRES_DB=tloz_poc",
    "postgres:17-alpine",
  ]);
  started.push(postgresName);
}

function startMongo() {
  runDocker([
    "run",
    "--detach",
    "--name",
    mongoName,
    "mongo:8.0",
    "--replSet",
    "rs0",
    "--bind_ip_all",
  ]);
  started.push(mongoName);
}

function waitForPostgres() {
  waitUntil("PostgreSQL", () => docker([
    "exec",
    postgresName,
    "pg_isready",
    "--username",
    "postgres",
    "--dbname",
    "tloz_poc",
  ], undefined, true).status === 0);
}

function waitForMongo() {
  waitUntil("MongoDB", () => docker([
    "exec",
    mongoName,
    "mongosh",
    "--quiet",
    "--eval",
    "quit(db.adminCommand({ ping: 1 }).ok ? 0 : 1)",
  ], undefined, true).status === 0);
  mongo("try { rs.status() } catch { rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]}) }");
  waitUntil("MongoDB replica set", () => docker([
    "exec",
    mongoName,
    "mongosh",
    "--quiet",
    "--eval",
    "quit(db.hello().isWritablePrimary ? 0 : 1)",
  ], undefined, true).status === 0);
}

function waitUntil(label, predicate) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (predicate()) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1_000);
  }
  throw new PocError("POC_ENGINE_UNAVAILABLE", `${label} no quedó listo en 60 segundos.`);
}

function postgres(sql) {
  return runDocker([
    "exec",
    "--interactive",
    postgresName,
    "psql",
    "--username",
    "postgres",
    "--dbname",
    "tloz_poc",
    "--tuples-only",
    "--no-align",
    "--set",
    "ON_ERROR_STOP=1",
  ], sql).stdout;
}

function mongo(script) {
  return runDocker([
    "exec",
    mongoName,
    "mongosh",
    "tloz_poc",
    "--quiet",
    "--eval",
    script,
  ]).stdout;
}

function postgresSummary() {
  return parseJsonOutput(postgres(`
    SELECT json_build_object(
      'containers',
      (
        SELECT json_agg(json_build_object(
          'id', id,
          'publicId', public_id,
          'presentation', presentation,
          'title', title,
          'data', data
        ) ORDER BY id)
        FROM containers
        WHERE id IN ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002')
      ),
      'contents',
      (
        SELECT json_agg(json_build_object(
          'id', id,
          'publicId', public_id,
          'containerId', container_id,
          'presentation', presentation,
          'title', title,
          'body', body,
          'data', data,
          'revision', revision
        ) ORDER BY id)
        FROM contents
        WHERE id IN (
          '10000000-0000-4000-8000-000000000001',
          '10000000-0000-4000-8000-000000000002',
          '10000000-0000-4000-8000-000000000003'
        )
      )
    );
  `));
}

function mongoSummary() {
  return parseJsonOutput(mongo(`
    const containers = db.containers.find(
      {_id: {$in: [
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002'
      ]}},
      {_id:1, publicId:1, presentation:1, title:1, data:1}
    ).sort({_id:1}).toArray().map(({_id, ...record}) => ({id:_id, ...record}));
    const contents = db.contents.find(
      {_id: {$in: [
        '10000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000003'
      ]}},
      {_id:1, publicId:1, containerId:1, presentation:1, title:1, body:1, data:1, revision:1}
    ).sort({_id:1}).toArray().map(({_id, ...record}) => ({id:_id, ...record}));
    print(JSON.stringify({containers, contents}));
  `));
}

function runDocker(args, input, allowFailure = false) {
  const result = docker(args, input, allowFailure);
  if (!allowFailure && result.status !== 0) {
    throw new PocError(
      "POC_COMMAND_FAILED",
      `docker ${args[0]} falló: ${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
  return result;
}

function docker(args, input, allowFailure = false) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    input,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error && !allowFailure) {
    throw new PocError("POC_DOCKER_FAILED", "No se pudo ejecutar Docker.", {
      cause: result.error,
    });
  }
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function checksum(value) {
  return createHash("sha256")
    .update(JSON.stringify(sortValue(value)))
    .digest("hex");
}

function parseJsonOutput(output) {
  const line = output
    .trim()
    .split("\n")
    .map((candidate) => candidate.trim())
    .reverse()
    .find((candidate) => candidate.startsWith("{") || candidate.startsWith("["));
  if (!line) {
    throw new PocError("POC_OUTPUT_INVALID", "El motor no devolvió evidencia JSON.");
  }
  return JSON.parse(line);
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortValue(child)]),
  );
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

const postgresSchema = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  CREATE TABLE IF NOT EXISTS containers (
    id UUID PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    presentation TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contents (
    id UUID PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    container_id UUID NOT NULL REFERENCES containers(id) ON DELETE RESTRICT,
    presentation TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  );

  CREATE INDEX IF NOT EXISTS contents_container_presentation_updated_idx
    ON contents(container_id, presentation, updated_at DESC);
  CREATE INDEX IF NOT EXISTS contents_status_idx
    ON contents(container_id, (data ->> 'status'), updated_at DESC);
  CREATE INDEX IF NOT EXISTS contents_data_gin_idx
    ON contents USING GIN(data);

  CREATE TABLE IF NOT EXISTS legacy_documents (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  );
  CREATE TABLE IF NOT EXISTS legacy_mission_documents (
    document_id UUID PRIMARY KEY REFERENCES legacy_documents(id) ON DELETE CASCADE,
    status TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS legacy_documents_project_kind_updated_idx
    ON legacy_documents(project_id, kind, updated_at DESC);
  CREATE INDEX IF NOT EXISTS legacy_missions_status_idx
    ON legacy_mission_documents(status, document_id);
`;

const postgresSeed = `
  INSERT INTO containers (
    id, public_id, slug, presentation, title, summary, body, definition, data,
    revision, created_at, updated_at
  ) VALUES
    (
      '00000000-0000-4000-8000-000000000001', 'project-tloz', 'tloz',
      'project', 'TLOZ', 'Proyecto operativo', '# TLOZ',
      '{"fields":[{"key":"status","visible":true}],"views":[{"id":"board","fields":["title","status"]}],"defaultView":"board"}',
      '{"ownerId":"user-zibot","color":"#d72228"}',
      1, '2026-07-30T00:00:00Z', '2026-07-30T00:00:00Z'
    ),
    (
      '00000000-0000-4000-8000-000000000002', 'inventory', 'inventory',
      'inventory', 'Inventory', '', '',
      '{"fields":[{"key":"status","visible":true}],"views":[{"id":"table","fields":["title","status"]}],"defaultView":"table"}',
      '{}',
      1, '2026-07-30T00:00:00Z', '2026-07-30T00:00:00Z'
    )
  ON CONFLICT (id) DO UPDATE SET
    public_id = EXCLUDED.public_id,
    slug = EXCLUDED.slug,
    presentation = EXCLUDED.presentation,
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    body = EXCLUDED.body,
    definition = EXCLUDED.definition,
    data = EXCLUDED.data,
    revision = EXCLUDED.revision,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO contents (
    id, public_id, container_id, presentation, title, summary, body, data,
    revision, created_at, updated_at
  ) VALUES
    (
      '10000000-0000-4000-8000-000000000001', 'INV-0001',
      '00000000-0000-4000-8000-000000000002', 'inventory-item',
      'API token', 'Referencia reutilizable', '',
      '{"status":"unlocked","expiresAt":null}',
      1, '2026-07-30T00:00:00Z', '2026-07-30T00:00:00Z'
    ),
    (
      '10000000-0000-4000-8000-000000000002', 'LIB-0001',
      '00000000-0000-4000-8000-000000000001', 'resource',
      'ADR compartido', '', '# ADR', '{}',
      1, '2026-07-30T00:00:00Z', '2026-07-30T00:00:00Z'
    ),
    (
      '10000000-0000-4000-8000-000000000003', 'TLO-0075',
      '00000000-0000-4000-8000-000000000001', 'mission',
      'Decidir persistencia', 'Comparar stores',
      E'## Criterios\\n\\n- [ ] Comparar',
      '{"status":"now","customPriority":"nuclear","internalNote":"hidden","optionalValue":null,"relations":[{"contentId":"10000000-0000-4000-8000-000000000001","relation":"uses_inventory","required":true}],"checklist":[{"id":"check-1","title":"Comparar","completed":false}],"resources":[{"id":"resource-adr","type":"link","title":"ADR","url":"https://example.test/adr"}]}',
      1, '2026-07-30T00:00:00Z', '2026-07-30T00:00:00Z'
    )
  ON CONFLICT (id) DO UPDATE SET
    public_id = EXCLUDED.public_id,
    container_id = EXCLUDED.container_id,
    presentation = EXCLUDED.presentation,
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    body = EXCLUDED.body,
    data = EXCLUDED.data,
    revision = EXCLUDED.revision,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO contents (
    id, public_id, container_id, presentation, title, data, revision, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    'GEN-' || series,
    '00000000-0000-4000-8000-000000000001',
    'mission',
    'Generated ' || series,
    jsonb_build_object('status', CASE WHEN series % 2 = 0 THEN 'now' ELSE 'later' END),
    1,
    '2026-07-30T00:00:00Z',
    '2026-07-30T00:00:00Z'::timestamptz + make_interval(secs => series)
  FROM generate_series(1, 5000) AS series
  ON CONFLICT (public_id) DO UPDATE SET
    container_id = EXCLUDED.container_id,
    presentation = EXCLUDED.presentation,
    title = EXCLUDED.title,
    data = EXCLUDED.data,
    revision = EXCLUDED.revision,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;
`;

const mongoSchema = `
  function ensureCollection(name, validator) {
    if (!db.getCollectionNames().includes(name)) {
      db.createCollection(name, {validator});
    } else {
      db.runCommand({collMod:name, validator});
    }
  }
  const commonRequired = [
    '_id', 'publicId', 'presentation', 'title', 'summary', 'body',
    'data', 'revision', 'createdAt', 'updatedAt'
  ];
  ensureCollection('containers', {$jsonSchema:{
    bsonType:'object',
    required:[...commonRequired, 'definition'],
    properties:{
      _id:{bsonType:'string'},
      publicId:{bsonType:'string'},
      presentation:{bsonType:'string'},
      title:{bsonType:'string'},
      definition:{bsonType:'object'},
      data:{bsonType:'object'},
      revision:{bsonType:'int', minimum:1}
    }
  }});
  ensureCollection('contents', {$jsonSchema:{
    bsonType:'object',
    required:[...commonRequired, 'containerId'],
    properties:{
      _id:{bsonType:'string'},
      publicId:{bsonType:'string'},
      containerId:{bsonType:'string'},
      presentation:{bsonType:'string'},
      title:{bsonType:'string'},
      data:{bsonType:'object'},
      revision:{bsonType:'int', minimum:1}
    }
  }});
  db.containers.createIndex({publicId:1}, {unique:true});
  db.containers.createIndex({slug:1}, {unique:true, sparse:true});
  db.contents.createIndex({publicId:1}, {unique:true});
  db.contents.createIndex({containerId:1, presentation:1, updatedAt:-1});
  db.contents.createIndex({containerId:1, 'data.status':1, updatedAt:-1});
`;

const mongoSeed = `
  const containers = [
    {
      _id:'00000000-0000-4000-8000-000000000001',
      publicId:'project-tloz',
      slug:'tloz',
      presentation:'project',
      title:'TLOZ',
      summary:'Proyecto operativo',
      body:'# TLOZ',
      definition:{
        fields:[{key:'status',visible:true}],
        views:[{id:'board',fields:['title','status']}],
        defaultView:'board'
      },
      data:{ownerId:'user-zibot',color:'#d72228'},
      revision:NumberInt(1),
      createdAt:'2026-07-30T00:00:00Z',
      updatedAt:'2026-07-30T00:00:00Z'
    },
    {
      _id:'00000000-0000-4000-8000-000000000002',
      publicId:'inventory',
      slug:'inventory',
      presentation:'inventory',
      title:'Inventory',
      summary:'',
      body:'',
      definition:{
        fields:[{key:'status',visible:true}],
        views:[{id:'table',fields:['title','status']}],
        defaultView:'table'
      },
      data:{},
      revision:NumberInt(1),
      createdAt:'2026-07-30T00:00:00Z',
      updatedAt:'2026-07-30T00:00:00Z'
    }
  ];
  const contents = [
    {
      _id:'10000000-0000-4000-8000-000000000001',
      publicId:'INV-0001',
      containerId:'00000000-0000-4000-8000-000000000002',
      presentation:'inventory-item',
      title:'API token',
      summary:'Referencia reutilizable',
      body:'',
      data:{status:'unlocked',expiresAt:null},
      revision:NumberInt(1),
      createdAt:'2026-07-30T00:00:00Z',
      updatedAt:'2026-07-30T00:00:00Z'
    },
    {
      _id:'10000000-0000-4000-8000-000000000002',
      publicId:'LIB-0001',
      containerId:'00000000-0000-4000-8000-000000000001',
      presentation:'resource',
      title:'ADR compartido',
      summary:'',
      body:'# ADR',
      data:{},
      revision:NumberInt(1),
      createdAt:'2026-07-30T00:00:00Z',
      updatedAt:'2026-07-30T00:00:00Z'
    },
    {
      _id:'10000000-0000-4000-8000-000000000003',
      publicId:'TLO-0075',
      containerId:'00000000-0000-4000-8000-000000000001',
      presentation:'mission',
      title:'Decidir persistencia',
      summary:'Comparar stores',
      body:'## Criterios\\n\\n- [ ] Comparar',
      data:{
        status:'now',
        customPriority:'nuclear',
        internalNote:'hidden',
        optionalValue:null,
        relations:[{
          contentId:'10000000-0000-4000-8000-000000000001',
          relation:'uses_inventory',
          required:true
        }],
        checklist:[{id:'check-1',title:'Comparar',completed:false}],
        resources:[{
          id:'resource-adr',
          type:'link',
          title:'ADR',
          url:'https://example.test/adr'
        }]
      },
      revision:NumberInt(1),
      createdAt:'2026-07-30T00:00:00Z',
      updatedAt:'2026-07-30T00:00:00Z'
    }
  ];
  for (const container of containers) {
    db.containers.replaceOne({_id:container._id}, container, {upsert:true});
  }
  for (const content of contents) {
    if (!db.containers.findOne({_id:content.containerId})) {
      throw new Error('STORE_REFERENCE_INVALID');
    }
    db.contents.replaceOne({_id:content._id}, content, {upsert:true});
  }
  const generated = [];
  for (let index = 1; index <= 5000; index += 1) {
    const document = {
      _id:'generated-' + index,
      publicId:'GEN-' + index,
      containerId:'00000000-0000-4000-8000-000000000001',
      presentation:'mission',
      title:'Generated ' + index,
      summary:'',
      body:'',
      data:{status:index % 2 === 0 ? 'now' : 'later'},
      revision:NumberInt(1),
      createdAt:'2026-07-30T00:00:00Z',
      updatedAt:new Date(Date.parse('2026-07-30T00:00:00Z') + index * 1000).toISOString()
    };
    generated.push({
      replaceOne:{
        filter:{_id:document._id},
        replacement:document,
        upsert:true
      }
    });
  }
  db.contents.bulkWrite(generated, {ordered:true});
`;

const postgresFailureChecks = `
  CREATE OR REPLACE FUNCTION poc_invalid_reference_code()
  RETURNS TEXT AS $$
  BEGIN
    BEGIN
      INSERT INTO contents (
        id, public_id, container_id, presentation, title, data, revision, created_at, updated_at
      ) VALUES (
        '20000000-0000-4000-8000-000000000001', 'INVALID-REF',
        '99999999-9999-4999-8999-999999999999', 'mission', 'Invalid',
        '{}', 1, now(), now()
      );
    EXCEPTION WHEN foreign_key_violation THEN
      RETURN 'STORE_REFERENCE_INVALID';
    END;
    RETURN 'UNEXPECTED_SUCCESS';
  END;
  $$ LANGUAGE plpgsql;

  CREATE OR REPLACE FUNCTION poc_revision_conflict_code()
  RETURNS TEXT AS $$
  DECLARE changed INTEGER;
  BEGIN
    UPDATE contents
    SET revision = revision + 1
    WHERE id = '10000000-0000-4000-8000-000000000003' AND revision = 1;
    UPDATE contents
    SET title = 'Stale'
    WHERE id = '10000000-0000-4000-8000-000000000003' AND revision = 1;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed = 0 THEN RETURN 'STORE_REVISION_CONFLICT'; END IF;
    RETURN 'UNEXPECTED_SUCCESS';
  END;
  $$ LANGUAGE plpgsql;

  SELECT json_build_object(
    'invalidReference', poc_invalid_reference_code(),
    'revisionConflict', poc_revision_conflict_code()
  );
`;

const mongoFailureChecks = `
  let invalidReference = 'UNEXPECTED_SUCCESS';
  try {
    const candidate = {
      _id:'20000000-0000-4000-8000-000000000001',
      publicId:'INVALID-REF',
      containerId:'99999999-9999-4999-8999-999999999999',
      presentation:'mission',
      title:'Invalid',
      summary:'',
      body:'',
      data:{},
      revision:NumberInt(1),
      createdAt:'2026-07-30T00:00:00Z',
      updatedAt:'2026-07-30T00:00:00Z'
    };
    if (!db.containers.findOne({_id:candidate.containerId})) {
      throw new Error('STORE_REFERENCE_INVALID');
    }
    db.contents.insertOne(candidate);
  } catch (error) {
    if (String(error).includes('STORE_REFERENCE_INVALID')) {
      invalidReference = 'STORE_REFERENCE_INVALID';
    } else {
      throw error;
    }
  }
  db.contents.updateOne(
    {_id:'10000000-0000-4000-8000-000000000003', revision:NumberInt(1)},
    {$inc:{revision:NumberInt(1)}}
  );
  const stale = db.contents.updateOne(
    {_id:'10000000-0000-4000-8000-000000000003', revision:NumberInt(1)},
    {$set:{title:'Stale'}}
  );
  const revisionConflict = stale.matchedCount === 0
    ? 'STORE_REVISION_CONFLICT'
    : 'UNEXPECTED_SUCCESS';
  print(JSON.stringify({invalidReference, revisionConflict}));
`;

const postgresBenchmark = `
  INSERT INTO legacy_documents (id, project_id, kind, title, updated_at)
  SELECT
    id,
    container_id,
    'mission',
    title,
    updated_at
  FROM contents
  WHERE public_id LIKE 'GEN-%'
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO legacy_mission_documents (document_id, status)
  SELECT id, data ->> 'status'
  FROM contents
  WHERE public_id LIKE 'GEN-%'
  ON CONFLICT (document_id) DO NOTHING;

  ANALYZE contents;
  ANALYZE legacy_documents;
  ANALYZE legacy_mission_documents;

  CREATE TEMP TABLE poc_timings (model TEXT, duration_ms DOUBLE PRECISION);
  DO $$
  DECLARE
    started_at TIMESTAMPTZ;
    sample INTEGER;
  BEGIN
    FOR sample IN 1..250 LOOP
      started_at := clock_timestamp();
      PERFORM c.id
      FROM contents c
      WHERE c.container_id = '00000000-0000-4000-8000-000000000001'
        AND c.presentation = 'mission'
        AND c.data ->> 'status' = 'now'
      ORDER BY c.updated_at DESC
      LIMIT 50;
      INSERT INTO poc_timings VALUES (
        'container-content',
        EXTRACT(EPOCH FROM clock_timestamp() - started_at) * 1000
      );

      started_at := clock_timestamp();
      PERFORM d.id
      FROM legacy_documents d
      JOIN legacy_mission_documents m ON m.document_id = d.id
      WHERE d.project_id = '00000000-0000-4000-8000-000000000001'
        AND d.kind = 'mission'
        AND m.status = 'now'
      ORDER BY d.updated_at DESC
      LIMIT 50;
      INSERT INTO poc_timings VALUES (
        'legacy',
        EXTRACT(EPOCH FROM clock_timestamp() - started_at) * 1000
      );
    END LOOP;
  END
  $$;

  SELECT json_build_object(
    'legacyP95Ms',
    round((SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
      FROM poc_timings WHERE model = 'legacy')::numeric, 3),
    'containerContentP95Ms',
    round((SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
      FROM poc_timings WHERE model = 'container-content')::numeric, 3)
  );
`;

const mongoBenchmark = `
  const timings = [];
  for (let sample = 0; sample < 250; sample += 1) {
    const startedAt = process.hrtime.bigint();
    db.contents.find({
      containerId:'00000000-0000-4000-8000-000000000001',
      presentation:'mission',
      'data.status':'now'
    }).sort({updatedAt:-1}).limit(50).toArray();
    timings.push(Number(process.hrtime.bigint() - startedAt) / 1000000);
  }
  timings.sort((left, right) => left - right);
  const p95 = timings[Math.ceil(timings.length * 0.95) - 1];
  print(JSON.stringify({containerContentP95Ms:Math.round(p95 * 1000) / 1000}));
`;

main();
