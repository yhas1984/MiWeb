import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

/**
 * Asegura que un directorio exista, creándolo si es necesario.
 * @param filePath Ruta del archivo para el cual se necesita el directorio.
 * @returns `true` si el directorio existe o se creó correctamente.
 */
export const ensureDirectoryExists = (filePath: string): boolean => {
  try {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
    return fs.existsSync(dirname);
  } catch (error) {
    console.error(`Error al crear directorio para ${filePath}:`, error);
    return false;
  }
};

/**
 * Escribe datos en un archivo de forma segura usando un archivo temporal.
 * Esto previene la corrupción de datos si el proceso de escritura es interrumpido.
 * @param filePath Ruta del archivo donde guardar los datos.
 * @param data Datos a guardar (objeto que será convertido a JSON).
 * @returns `true` si la operación fue exitosa.
 */
export const safeWriteJsonToFile = (filePath: string, data: any): boolean => {
  // Genera un nombre de archivo temporal único en el mismo directorio.
  const tempFilePath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${randomBytes(6).toString("hex")}.tmp`
  );

  try {
    // Asegurar que el directorio existe.
    if (!ensureDirectoryExists(filePath)) {
      throw new Error(`No se pudo crear el directorio para ${filePath}`);
    }

    // Convertir datos a JSON con formato.
    const jsonData = JSON.stringify(data, null, 2);

    // Escribir los datos en el archivo temporal.
    fs.writeFileSync(tempFilePath, jsonData, "utf8");

    // Renombrar el archivo temporal al archivo final (operación atómica).
    fs.renameSync(tempFilePath, filePath);

    return true;
  } catch (error) {
    console.error(`Error en la escritura segura para ${filePath}:`, error);

    // Si el archivo temporal todavía existe, intenta eliminarlo.
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error(
          `Error al limpiar el archivo temporal ${tempFilePath}:`,
          cleanupError
        );
      }
    }
    return false;
  }
};

/**
 * Lee un archivo JSON y lo convierte a un objeto.
 * @param filePath Ruta del archivo a leer.
 * @param defaultValue Valor por defecto si el archivo no existe o hay un error.
 * @returns El objeto leído del archivo o el valor por defecto.
 */
export const readJsonFromFile = <T>(
  filePath: string,
  defaultValue: T
): T => {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    // Maneja el caso de un archivo vacío que resultaría en un error de JSON.parse.
    if (fileContent.trim() === "") {
        return defaultValue;
    }
    return JSON.parse(fileContent) as T;
  } catch (error: any) {
    console.error(`Error al leer o parsear ${filePath}:`, error);
    return defaultValue;
  }
};
