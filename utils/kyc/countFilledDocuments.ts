const defaultProofTypes = [
  "document",
  "additional_document",
  "document_two",
  "additional_document_two",
] as const;

type ProofLike = {
  type: string;
  document: string;
};

export function countFilledDocuments(
  proofs: ProofLike[] | undefined,
  expectedTypes: ReadonlyArray<string> = defaultProofTypes
): { filled: number; all: number } {
  if (!expectedTypes.length) {
    return { filled: 0, all: 0 };
  }

  const availableTypes = new Set(
    (proofs ?? [])
      .filter((proof) => expectedTypes.includes(proof.type) && proof.document)
      .map((proof) => proof.type)
  );

  return {
    filled: availableTypes.size,
    all: expectedTypes.length,
  };
}
