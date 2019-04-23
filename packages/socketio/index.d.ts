import http from 'http';
import io from 'socket.io';

declare const socketio: FeathersSocketIO;
export = socketio;

interface FeathersSocketIO {
  (callback?: (io: io.Server) => void): () => void;
  (options: number | io.ServerOptions, callback?: (io: io.Server) => void): () => void;
  (port: number, options?: io.ServerOptions, callback?: (io: io.Server) => void): () => void;
  readonly SOCKET_KEY: unique symbol;
  default: FeathersSocketIO;
}

declare module '@feathersjs/feathers' {
  interface Application<ServiceTypes = any> {
    listen (port: number): http.Server;
  }
}
