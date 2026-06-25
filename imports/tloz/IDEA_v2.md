# The Legend of Zivelo (TLOZ)

## Descripción General

TLOZ es una metodología de planeación ligera diseñada para equipos pequeños, proyectos personales, startups y productos en etapa temprana.

Se enfoca en:
- Claridad
- Visibilidad
- Trabajo en progreso limitado
- Exploración y validación
- Bajo overhead organizacional

TLOZ está inspirado en los RPGs de aventura pero sigue siendo un framework de planeación profesional.

---

## Principios Fundamentales

- El trabajo se organiza alrededor de Missions.
- Cada Mission tiene un resultado claro.
- Cada Mission tiene un único owner.
- La exploración se considera trabajo de valor.
- Las ideas siempre deben tener un lugar.
- El trabajo activo debe permanecer limitado.
- Toda Mission termina con una conclusión.

---

## Estructura Global

### Temporadas

Una Temporada representa una versión mayor del producto.

Ejemplo:

- Temporada 1 = v1.0.0 (MVP)
- Temporada 2 = v2.0.0

### Episodios

Un Episodio es un milestone dentro de una Temporada, identificado con numeración romana.

Ejemplo:

- Episodio I — Módulo de Clientes
- Episodio II — Módulo de Pagos

Las Missions pertenecen a Episodios. Los Episodios pertenecen a Temporadas.

### Proyectos

Las Missions también pertenecen a Proyectos.

Ejemplos:

- Auth
- Join Flow
- Wallets
- Rewards

Puede existir un Proyecto global que represente la organización completa.

Ejemplo:

- Zivelo

---

## Categorías de Missions

### Quest

Trabajo de construcción de producto.

#### Main Quest

Un entregable significativo que hace avanzar el producto.

Ejemplos:

- Login Stability
- Join Flow Completion
- MVP Release

Pueden existir múltiples Main Quests en el sistema.

#### Side Quest

Trabajo útil que aporta valor sin ser crítico al progreso actual.

Ejemplos:

- Landing Page
- UI Improvements
- Small Refactors

---

### Support Quest

Trabajo de soporte que ayuda a la toma de decisiones o al mantenimiento.

#### Exploration Quest

Trabajo de investigación, validación y descubrimiento.

Ejemplos:

- Investigate WhatsApp Authentication
- Evaluate Wallet Providers
- Validate Business Ideas

Toda Exploration Quest debe terminar con una de las siguientes conclusiones:

- Hacerlo
- No hacerlo
- Postergarlo
- Requiere otra exploración específica

#### Farming Quest

Trabajo de mantenimiento.

Ejemplos:

- Bug Fixes
- Documentation
- Cleanup
- Reviews

---

## Estados de Trabajo

### Now

Trabajo activo.

### Next

Trabajo validado, ya aceptado y esperando capacidad.

### Later

Trabajo aún no accionable. Incluye:

- Ideas
- Oportunidades
- Trabajo no validado
- Trabajo bloqueado por dependencias

### Completed

Trabajo terminado. Usado para historial y seguimiento de progreso.

---

## Límites de Trabajo Activo

Los límites aplican por usuario.

Un usuario puede tener:

- 1 Quest activa
  - Main Quest O Side Quest

Y además:

- 1 Support Quest activa
  - Exploration Quest O Farming Quest

Ejemplos:

Válido:
- Main Quest + Exploration Quest
- Side Quest + Farming Quest

Inválido:
- Main Quest + Main Quest
- Exploration Quest + Exploration Quest

El propósito de esta regla es preservar el foco y reducir el cambio de contexto.

---

## Quest Items

Los Quest Items son desbloqueos reutilizables.

Ejemplos:

- Apple Developer Account
- Approved Budget
- Signed Contract
- Selected Provider
- Purchased Domain

Un Quest Item puede desbloquear múltiples Missions.

Los Quest Items normalmente son producidos por Missions. Al completar la Mission correspondiente, el Quest Item se marca como desbloqueado.

Cuando un Quest Item no está asociado a ninguna Mission, cualquier miembro del equipo puede marcarlo como desbloqueado manualmente.

---

## Dependencias

Tipos de dependencia soportados:

- Mission → Mission
- Mission → Quest Item

Los Quest Items ayudan a priorizar trabajo fundacional porque pueden desbloquear múltiples Missions futuras.

---

## Clasificación Kano

Opcional. Se usa para entender la percepción del usuario.

Categorías:

- Basic
- Performance
- Delighter

Kano no es un sistema de priorización.

---

## Información de una Mission

Cada Mission debe contener:

- Nombre
- Descripción
- Proyecto
- Episodio
- Owner
- Categoría de Mission
- Estado
- Definición de Resultado
- Dependencias
- Quest Items
- Clasificación Kano (opcional)
- Fecha límite (opcional)
- Fecha de creación
- Fecha de actualización
- Fecha de completado

---

## Criterios de Éxito

Cualquier miembro del equipo debe poder responder en menos de 30 segundos:

- ¿En qué estoy trabajando?
- ¿En qué está trabajando mi compañero de equipo?
- ¿Qué debería pasar después?
- ¿Qué estamos explorando?
- ¿Qué ideas tenemos?
- ¿Qué está bloqueado?
- ¿Qué se necesita para desbloquearlo?

Si esas preguntas se pueden responder rápidamente, TLOZ está funcionando correctamente.
