import {
  InvoiceItem,
  InvoicePractice,
  ItemDocument,
  DocumentationStatus,
  FinalStatus,
  ValidationStatus,
} from './types'

export interface DocumentValidationUpdate {
  id: string
  validation_status: ValidationStatus
}

export interface ValidationResult {
  documentation_status: DocumentationStatus
  final_status: FinalStatus
  documentUpdates: DocumentValidationUpdate[]
}

/**
 * Evaluates an invoice item against its practice and attached documents.
 * Returns the derived documentation_status, final_status, and per-document
 * validation_status updates.
 *
 * This is a pure function — no DB calls.
 */
export function validateInvoiceItem(
  item: InvoiceItem,
  practice: InvoicePractice,
  documents: ItemDocument[],
): ValidationResult {
  const billedAmount = parseFloat(item.billed_amount)
  const expectedAmount = parseFloat(item.expected_amount)
  const amountsMatch = billedAmount === expectedAmount

  // 1. Inactive coverage → rejected
  if (item.coverage_status === 'inactive') {
    return {
      documentation_status: deriveDocumentationStatus(practice, documents),
      final_status: 'rejected',
      documentUpdates: buildDocumentUpdates(documents),
    }
  }

  // 2. Pending coverage → pending final status
  if (item.coverage_status === 'pending') {
    return {
      documentation_status: deriveDocumentationStatus(practice, documents),
      final_status: 'pending',
      documentUpdates: buildDocumentUpdates(documents),
    }
  }

  // coverage_status === 'active' from here on
  const documentUpdates = buildDocumentUpdates(documents)
  const documentation_status = deriveDocumentationStatus(practice, documents)

  // 7. Amount mismatch → observed
  if (!amountsMatch) {
    return { documentation_status, final_status: 'observed', documentUpdates }
  }

  // 8. All checks pass → approved
  if (documentation_status === 'ok' || documentation_status === 'not_required') {
    return { documentation_status, final_status: 'approved', documentUpdates }
  }

  // documentation pending or observed → observed final
  return { documentation_status, final_status: 'observed', documentUpdates }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function deriveDocumentationStatus(
  practice: InvoicePractice,
  documents: ItemDocument[],
): DocumentationStatus {
  // Rule 3: documentation not required
  if (!practice.requires_documentation) return 'not_required'

  // Rule 4: required but no documents
  if (documents.length === 0) return 'pending'

  // Rule 5 & 6: check each document; any observed → documentation observed
  const anyObserved = documents.some((doc) => {
    if (doc.document_type === 'traslado') {
      return isTrasladoInvalid(doc)
    }
    return false
  })

  return anyObserved ? 'observed' : 'ok'
}

function buildDocumentUpdates(documents: ItemDocument[]): DocumentValidationUpdate[] {
  return documents.map((doc) => {
    if (doc.document_type === 'traslado') {
      return {
        id: doc.id,
        validation_status: isTrasladoInvalid(doc) ? 'observed' : 'ok',
      }
    }
    // Non-traslado documents keep their existing status (or ok if not traslado)
    return { id: doc.id, validation_status: doc.validation_status }
  })
}

function isTrasladoInvalid(doc: ItemDocument): boolean {
  if (!doc.origin || !doc.destination) return true
  const km = doc.kilometers !== null ? parseFloat(doc.kilometers ?? '') : null
  if (km === null || isNaN(km) || km <= 0) return true
  return false
}
