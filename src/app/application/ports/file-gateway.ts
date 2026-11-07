/** Acesso a arquivos locais escolhidos ou baixados pelo usuário. */
export abstract class FileGateway {
  abstract download(fileName: string, content: string): void;
  abstract readText(file: File): Promise<string>;
}
