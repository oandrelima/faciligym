# Prompt para Desenvolvimento: Aplicativo de Academia (iOS / AltStore)

**Atue como um desenvolvedor full-stack e engenheiro mobile sênior.** Preciso construir um aplicativo de academia para iOS que será distribuído por fora da App Store, através da AltStore PAL. O aplicativo terá uma escala muito reduzida, projetado para no máximo 10 usuários.

## Stack Tecnológico Desejado:
*   **Frontend Mobile:** React Native (com Expo) ou SwiftUI (o que for mais prático para gerar o arquivo `.ipa` e distribuir via AltStore).
*   **Banco de Dados:** NeonDB (Serverless PostgreSQL).
*   **Backend:** Escolha a abordagem mais leve e eficiente para conectar o app ao NeonDB (como Next.js API Routes, tRPC ou um backend Node/Hono simples).

## Funcionalidades Principais (Core Features):
1.  **Registro de Frequência:** Um calendário ou sistema de log onde o usuário possa marcar e visualizar rapidamente os dias em que treinou.
2.  **Montagem de Treinos:** Uma interface para criar, salvar e gerenciar rotinas de treino (ex: divisões como ABC, listas de exercícios, séries e repetições).
3.  **Gestão de Dietas:** Um módulo para cadastrar, salvar e consultar planejamentos alimentares diários.

## Diretrizes de UI/UX e Design:
O aplicativo deve ter uma estética **minimalista, moderna e premium**. Priorize uma interface extremamente limpa (clean), sem poluição visual, utilizando bom espaçamento (white space), paleta de cores sóbria e tipografia elegante, focando diretamente na usabilidade durante o treino.

## Restrições e Arquitetura:
*   Como o limite é de 10 usuários, a infraestrutura deve focar em custo zero, aproveitando o *free tier* do NeonDB.
*   O sistema de autenticação deve ser o mais simples possível (ex: login básico ou convites pré-gerados).

## Sua Tarefa:
1.  Sugira a melhor arquitetura inicial para esse caso de uso.
2.  Crie a modelagem do banco de dados relacional (esquema SQL) para o NeonDB contemplando Usuários, Treinos, Exercícios, Histórico de Frequência e Dietas.
3.  Forneça o passo a passo de configuração do projeto e explique como preparar o build para extrair o `.ipa` focado na AltStore.
