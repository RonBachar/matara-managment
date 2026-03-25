type StoredAgreementFile = {
  id: string
  name: string
  type: string
  blob: Blob
}

const DB_NAME = 'matara_files_v1'
const STORE_NAME = 'agreement_files'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'))
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted.'))
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed.'))
  })
}

export type AgreementFileRef = {
  agreementFileId: string
  agreementFileName: string
  agreementFileType: string
}

export async function saveAgreementFile(file: File): Promise<AgreementFileRef> {
  const db = await openDb()
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
  const record: StoredAgreementFile = {
    id,
    name: file.name,
    type: file.type || 'application/octet-stream',
    blob: file,
  }

  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(record)
  await txDone(tx)

  return {
    agreementFileId: id,
    agreementFileName: record.name,
    agreementFileType: record.type,
  }
}

export async function getAgreementFile(
  id: string,
): Promise<StoredAgreementFile | null> {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const request = tx.objectStore(STORE_NAME).get(id)
  const result = await new Promise<StoredAgreementFile | undefined>((resolve, reject) => {
    request.onerror = () => reject(request.error ?? new Error('Failed to read file from IndexedDB.'))
    request.onsuccess = () => resolve(request.result as StoredAgreementFile | undefined)
  })
  await txDone(tx)
  return result ?? null
}

export async function deleteAgreementFile(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(id)
  await txDone(tx)
}

/** Same IndexedDB storage as agreements; use for client work contracts. */
export type ContractFileRef = {
  contractFileId: string
  contractFileName: string
  contractFileType: string
}

export async function saveContractFile(file: File): Promise<ContractFileRef> {
  const ref = await saveAgreementFile(file)
  return {
    contractFileId: ref.agreementFileId,
    contractFileName: ref.agreementFileName,
    contractFileType: ref.agreementFileType,
  }
}

export function getContractFile(id: string) {
  return getAgreementFile(id)
}

export function deleteContractFile(id: string) {
  return deleteAgreementFile(id)
}

