import { XMLLoader, JSONLoader, CSVLoader, DocumentLoaderFactory } from '../utils/documentLoaders';
import * as path from 'path';

async function testarLoaders() {
  console.log('🧪 Testando os novos loaders...\n');

  const pastaBase = path.join(__dirname, '../../base');

  // Teste XML
  console.log('📄 Testando XML Loader...');
  try {
    const xmlLoader = new XMLLoader(path.join(pastaBase, 'exemplo.xml'));
    const xmlDocs = await xmlLoader.load();
    console.log(`✅ XML carregado com sucesso! Documentos: ${xmlDocs.length}`);
    console.log(`📝 Conteúdo (primeiros 200 chars): ${xmlDocs[0].pageContent.substring(0, 200)}...`);
    console.log(`🏷️  Metadata:`, xmlDocs[0].metadata);
  } catch (error) {
    console.error('❌ Erro ao carregar XML:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste JSON
  console.log('📄 Testando JSON Loader...');
  try {
    const jsonLoader = new JSONLoader(path.join(pastaBase, 'exemplo.json'));
    const jsonDocs = await jsonLoader.load();
    console.log(`✅ JSON carregado com sucesso! Documentos: ${jsonDocs.length}`);
    console.log(`📝 Conteúdo (primeiros 200 chars): ${jsonDocs[0].pageContent.substring(0, 200)}...`);
    console.log(`🏷️  Metadata:`, jsonDocs[0].metadata);
  } catch (error) {
    console.error('❌ Erro ao carregar JSON:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste CSV
  console.log('📄 Testando CSV Loader...');
  try {
    const csvLoader = new CSVLoader(path.join(pastaBase, 'exemplo.csv'));
    const csvDocs = await csvLoader.load();
    console.log(`✅ CSV carregado com sucesso! Documentos: ${csvDocs.length}`);
    console.log(`📝 Conteúdo (primeiros 200 chars): ${csvDocs[0].pageContent.substring(0, 200)}...`);
    console.log(`🏷️  Metadata:`, csvDocs[0].metadata);
  } catch (error) {
    console.error('❌ Erro ao carregar CSV:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste Factory
  console.log('🏭 Testando Document Loader Factory...');
  try {
    const arquivos = ['exemplo.xml', 'exemplo.json', 'exemplo.csv'];
    
    for (const arquivo of arquivos) {
      const caminhoCompleto = path.join(pastaBase, arquivo);
      const loader = DocumentLoaderFactory.createLoader(caminhoCompleto);
      const docs = await loader.load();
      console.log(`✅ Factory criou loader para ${arquivo}: ${docs.length} documentos`);
    }
  } catch (error) {
    console.error('❌ Erro no Factory:', error);
  }

  console.log('\n🎉 Testes concluídos!');
}

// Executar os testes
testarLoaders().catch(console.error); 