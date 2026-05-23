/**
 * NLP Clustering local (TF-IDF + Cosine Similarity)
 * 
 * No requiere API externa. Funciona completamente en el servidor.
 * Genera vectores TF-IDF para representar semánticamente cada texto
 * y los agrupa por similitud de coseno.
 */

// --- Tokenización ---
function tokenize(text: string): string[] {
  const stopwords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'que', 'en', 'y', 'a',
    'es', 'se', 'no', 'me', 'te', 'su', 'por', 'con', 'para', 'lo', 'al', 'como',
    'si', 'mi', 'o', 'le', 'más', 'pero', 'ya', 'muy', 'yo', 'tu', 'este', 'esta',
    'tengo', 'tiene', 'hay', 'hola', 'gracias', 'favor', 'puede', 'puedo',
    'the', 'a', 'an', 'is', 'in', 'on', 'at', 'to', 'of', 'and', 'or'
  ]);

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word));
}

// --- TF-IDF ---
function computeTFIDF(texts: string[]): { vectors: number[][], vocab: string[] } {
  const tokenizedTexts = texts.map(tokenize);
  
  // Vocabulario global
  const vocabSet = new Set<string>();
  tokenizedTexts.forEach(tokens => tokens.forEach(t => vocabSet.add(t)));
  const vocab = Array.from(vocabSet);

  // Term Frequency por documento
  const tfVectors = tokenizedTexts.map(tokens => {
    const freq: Record<string, number> = {};
    tokens.forEach(t => freq[t] = (freq[t] || 0) + 1);
    return vocab.map(term => (freq[term] || 0) / (tokens.length || 1));
  });

  // Inverse Document Frequency
  const idf = vocab.map(term => {
    const docsWithTerm = tokenizedTexts.filter(tokens => tokens.includes(term)).length;
    return Math.log((texts.length + 1) / (docsWithTerm + 1)) + 1;
  });

  // TF-IDF final
  const vectors = tfVectors.map(tf =>
    tf.map((val, i) => val * idf[i])
  );

  return { vectors, vocab };
}

// --- Similitud de coseno ---
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0, mA = 0, mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(mA) * Math.sqrt(mB);
  return denom === 0 ? 0 : dot / denom;
}

// --- Clustering ---
export function simpleCluster(texts: string[], _embeddings: number[][], threshold = 0.15): string[][] {
  // Ignoramos _embeddings externos (compatibilidad) y usamos TF-IDF local
  if (texts.length === 0) return [];

  const { vectors } = computeTFIDF(texts);
  const clusters: string[][] = [];
  const visited = new Set<number>();

  for (let i = 0; i < texts.length; i++) {
    if (visited.has(i)) continue;
    const cluster = [texts[i]];
    visited.add(i);

    for (let j = i + 1; j < texts.length; j++) {
      if (visited.has(j)) continue;
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      if (sim > threshold) {
        cluster.push(texts[j]);
        visited.add(j);
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}

// --- Reemplazo de getEmbedding (ya no se necesita API) ---
// Se mantiene por compatibilidad con generate-faqs.ts pero devuelve vector vacío.
// El clustering ahora lo hace simpleCluster() internamente con TF-IDF.
export async function getEmbedding(_text: string): Promise<number[]> {
  return []; // No-op: el clustering es local
}
