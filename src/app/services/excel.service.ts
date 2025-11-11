import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ArchivoExcel } from '../models/informe.model';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  
  leerExcel(file: File): Promise<ArchivoExcel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1,
            defval: '' 
          });
          
          resolve({
            nombre: file.name,
            datos: jsonData
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  leerImagen(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}