import { dataClient } from "@zipform/data";
import { cache } from "react";

export { dataClient };

export const getCurrentUser = cache(() => dataClient.user.getCurrent());
