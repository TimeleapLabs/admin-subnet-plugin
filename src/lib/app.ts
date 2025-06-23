export const appId = process.env.TIMELEAP_APP_ID
  ? parseInt(process.env.TIMELEAP_APP_ID, 10)
  : 1337;

export const pluginName = "swiss.timeleap.admin.v1";
export const protocolVersion = "1.0.0";
export const name = "Timeleap Admin Subnet";
export const version = "1.0.0";
