/** Armazenamento chave-valor de objetos serializáveis. */
export abstract class KeyValueStore {
  abstract read<T>(key: string): T | null;
  abstract write<T>(key: string, value: T): void;
}
