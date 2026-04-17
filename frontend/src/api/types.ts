export interface SetupSchema {
  username: string;
  password: string;
  ncoreUsername: string;
  ncorePassword: string;
}

export interface LoginSchema {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  ncoreUsername: string;
  createdAt: string;
}

export interface Device {
  id: number;
  name: string;
  createdAt: string;
  manifestUrl?: string;
}

export interface DeviceCreateResponse {
  device: Device;
  token: string;
  manifestUrl: string;
}

export interface SystemStatus {
  ncoreConnected: boolean;
  activeTorrents: number;
  uptime: number;
  version: string;
  nodeVersion: string;
}
