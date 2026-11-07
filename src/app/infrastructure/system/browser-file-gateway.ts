import { Injectable } from '@angular/core';
import { FileGateway } from '../../application/ports/file-gateway';

@Injectable()
export class BrowserFileGateway extends FileGateway {
  download(fileName: string, content: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  readText(file: File): Promise<string> {
    return file.text();
  }
}
