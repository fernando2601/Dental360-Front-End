import React from 'react';
import KnowledgeBase from '@/components/knowledge-base';

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Área de Aprendizado</h1>
        <p className="text-muted-foreground">
          Biblioteca de materiais educativos, protocolos clínicos e formulários para pacientes e profissionais
        </p>
      </div>
      
      <KnowledgeBase />
    </div>
  );
}