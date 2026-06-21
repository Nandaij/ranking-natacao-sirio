import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Documento único compartilhado entre todos os professores/alunos.
// Coleção "ranking-natacao", documento "estado-global".
const DOC_REF = doc(db, "ranking-natacao", "estado-global");

export const defaultState = { turma: "AP2", alunos: [], aulas: [] };

/**
 * Escuta mudanças em tempo real no documento do Firestore.
 * Chama callback(data) sempre que algo mudar (inclusive vindo de outro aparelho).
 * Retorna uma função para cancelar a escuta (unsubscribe).
 */
export function subscribeToData(callback) {
  return onSnapshot(
    DOC_REF,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      } else {
        // Documento ainda não existe: cria com o estado padrão
        setDoc(DOC_REF, defaultState).catch(() => {});
        callback(defaultState);
      }
    },
    (error) => {
      console.error("Erro ao sincronizar com Firestore:", error);
      callback(null, error);
    }
  );
}

/**
 * Salva o estado completo no Firestore.
 * Qualquer outro aparelho conectado recebe a atualização automaticamente.
 */
export async function saveData(data) {
  try {
    await setDoc(DOC_REF, data);
    return true;
  } catch (e) {
    console.error("Erro ao salvar no Firestore:", e);
    return false;
  }
}
