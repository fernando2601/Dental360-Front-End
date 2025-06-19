import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Maximize2, Minimize2, Send, User, Bot, Sparkles } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Tipagem para as mensagens
type Message = {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
};

// Interface para controle de contexto da conversa
interface ChatContext {
  lastInteraction: Date;
  hasGivenDiscount: boolean;
  discountAmount: number;
  sentimentDetected: 'positive' | 'negative' | 'neutral';
  needsFollowUp: boolean;
  followUpTime: Date | null;
  mentionedPrice: boolean;
  mentionedFamilyLoss: boolean;
  paymentMethod: string | null;
  interestedInService: string | null;
  hasSevereMentalState: boolean;
  recentTopics: string[];
  frequentQuestions: string[];
}

// Interface para sugestões de IA
interface AISuggestion {
  id: string;
  text: string;
  type: 'general' | 'appointment' | 'service' | 'payment' | 'discount';
  context?: string;
}

// Respostas pré-definidas
const RESPONSES = {
  greeting: "Olá! Seja MUITO bem-vindo(a) à nossa clínica ✨\nEu sou o assistente virtual mais animado do Brasil! 😁\nComo você está hoje?",
  positive: "Que alegria! 😍 Vamos deixar seu sorriso ainda mais incrível!\nPosso te ajudar a encontrar o serviço ideal?",
  negative: "Poxa, sinto muito por isso. 😔\nPara melhorar seu dia, aqui vai um presente especial 🎁:\n**CUPOM DE DESCONTO DE 15%** para qualquer procedimento hoje!\n\nQuer que eu te ajude a agendar seu horário? 💬",
  services: "Esses são alguns dos nossos procedimentos mais procurados! 💖\n\n**Dentista:**\n• Limpeza: R$ 120\n• Clareamento: R$ 400\n• Tratamento de cárie: R$ 250\n• Aparelho ortodôntico (manutenção): R$ 180\n• Implante dentário: R$ 1.800\n\n**Harmonização Facial:**\n• Botox: R$ 500\n• Preenchimento labial: R$ 650\n• Bichectomia: R$ 1.200\n• Lifting facial com fios de PDO: R$ 2.000\n• Bioestimulador de colágeno: R$ 800\n\nPosso te passar mais detalhes sobre qualquer um deles! 👩‍⚕️👨‍⚕️",
  schedule: "Gostaria de agendar uma avaliação gratuita? 📅\nTemos horários incríveis essa semana!\nPosso ver qual o melhor para você?",
  doubt: "Sem problema! Estou aqui para te ajudar com calma! 🫶\nSe eu não expliquei direito, me avise e eu tento de outra forma! 😉\nSeu sorriso merece o melhor!",
  advantages: "Por que escolher a nossa clínica? 😍\n\n✨ Profissionais premiados e apaixonados pelo que fazem\n✨ Atendimento acolhedor e humanizado\n✨ Equipamentos modernos para seu conforto e segurança\n✨ Resultados naturais e personalizados para você!\n\nAqui você não é só mais um paciente, você é parte da nossa família 💖",
  closing: "Fique à vontade para me perguntar o que quiser!\nEstou aqui para te dar toda atenção do mundo! 🌎💬\n\nQual serviço você gostaria de saber mais? 😄",
  // A função generatePaymentResponse retorna uma das variações de respostas sobre pagamento
  get payment() { 
    const options = [
      "Temos TODAS as opções para facilitar sua vida! 💸\n\n• Dinheiro: 5% de DESCONTO IMEDIATO!\n• Cartão de crédito: 12x SEM JUROS!\n• Débito e PIX: Praticidade e rapidez\n\nALÉM DISSO, para pagamentos FECHADOS HOJE, você ganha um CHECK-UP COMPLETO + LIMPEZA PROFISSIONAL totalmente GRATUITOS!\n\nQual opção é melhor para você? Podemos RESERVAR SEU HORÁRIO AGORA! ⏰",
      "Facilitamos ao MÁXIMO para você! 💰\n\n• DINHEIRO: Desconto ESPECIAL de 5%\n• CRÉDITO: Parcele em 12x SEM JUROS!\n• Aceitamos TODOS os cartões e PIX\n\nTemos também nosso PLANO EXCLUSIVO com mensalidades a partir de R$59,90 que incluem CONSULTAS ILIMITADAS!\n\nQuer ECONOMIZAR e ter o MELHOR SORRISO ao mesmo tempo? Vamos agendar HOJE? 📱",
      "TEMOS VÁRIAS FORMAS DE PAGAMENTO EXCLUSIVAS! 💵💳\n\n• Dinheiro à vista: 5% OFF!\n• Cartão: até 12x SEM JUROS!\n• PIX: Rápido e seguro\n\nAPROVEITE NOSSA PROMOÇÃO: Fechando QUALQUER tratamento HOJE, você ganha um KIT DENTAL PROFISSIONAL (escova, fio e gel clareador) TOTALMENTE GRÁTIS!\n\nQuer garantir essa OFERTA LIMITADA? Posso agendar seu horário AGORA MESMO! ⏳"
    ];
    
    return options[Math.floor(Math.random() * options.length)];
  },
  siso: "Claro! E olha, tirar o siso com a gente é super tranquilo, viu? 😁\nTemos técnicas modernas que deixam o procedimento rápido e confortável.\n\nO valor da extração é R$ 250 por dente, e dá para parcelar em até 10x sem juros!\n\nQuer agendar uma avaliação gratuita?",
  clareamento: "Já pensou sair com aquele sorriso de revista? 📸\nA gente faz clareamento profissional seguro e com resultados incríveis! Seu sorriso pode ficar até 5 tons mais branco!\n\nO valor é R$ 400 e hoje temos uma oferta especial com 10% de desconto! Quer aproveitar?",
  bruxismo: "O bruxismo é mais comum do que você imagina! 😉\nTemos protetores bucais personalizados que vão proteger seus dentes e aliviar a tensão.\n\nO valor do protetor é R$ 200 e inclui as consultas de ajuste. Quer mais informações ou já podemos agendar?",
  default: "Estou aqui para te ajudar com qualquer dúvida sobre tratamentos dentários ou de harmonização! 😊\nQuer informações sobre algum procedimento específico ou prefere agendar uma avaliação gratuita?",
  inactivity: "Ainda está por aí? 😊 Estou aqui esperando suas perguntas ou podemos continuar nossa conversa depois se preferir!",
  goodbye: "Foi um prazer conversar com você! Estarei aqui quando precisar de informações ou quiser agendar sua consulta. Tenha um ótimo dia e volte sempre! 😊✨",
  
  // Horários de atendimento
  horarios: "Nossos horários de atendimento são super flexíveis para atender à sua rotina! ⏰\n\n**Segunda a Sexta:** 9h às 21h\n**Sábados:** 8h às 16h\n**Domingos:** Fechado\n\nQue tal agendarmos um horário para você? Temos várias opções disponíveis essa semana! 📅",
  
  // Dias específicos
  segunda: "Na segunda-feira temos os seguintes horários disponíveis:\n\n• 09:30 - 10:30 (Dra. Cláudia)\n• 11:00 - 12:00 (Dr. Ricardo)\n• 14:15 - 15:15 (Dra. Cláudia)\n• 16:30 - 17:30 (Dr. Ricardo)\n• 18:45 - 19:45 (Dra. Cláudia)\n\nQual horário seria melhor para você?",
  terca: "Na terça-feira temos os seguintes horários disponíveis:\n\n• 10:00 - 11:00 (Dr. Ricardo)\n• 13:30 - 14:30 (Dra. Cláudia)\n• 15:00 - 16:00 (Dr. Ricardo)\n• 17:15 - 18:15 (Dra. Patrícia)\n• 19:30 - 20:30 (Dr. Ricardo)\n\nAlgum desses horários funciona para você?",
  quarta: "Na quarta-feira temos os seguintes horários disponíveis:\n\n• 09:15 - 10:15 (Dra. Patrícia)\n• 11:30 - 12:30 (Dr. Ricardo)\n• 14:00 - 15:00 (Dra. Cláudia)\n• 16:15 - 17:15 (Dra. Patrícia)\n• 18:30 - 19:30 (Dr. Ricardo)\n\nQual seria o melhor horário para você?",
  quinta: "Na quinta-feira temos os seguintes horários disponíveis:\n\n• 09:45 - 10:45 (Dr. Ricardo)\n• 12:00 - 13:00 (Dra. Patrícia)\n• 14:30 - 15:30 (Dr. Ricardo)\n• 16:45 - 17:45 (Dra. Cláudia)\n• 19:00 - 20:00 (Dra. Patrícia)\n\nQual horário se encaixa melhor na sua agenda?",
  sexta: "Na sexta-feira temos os seguintes horários disponíveis:\n\n• 09:00 - 10:00 (Dra. Cláudia)\n• 11:15 - 12:15 (Dra. Patrícia)\n• 13:45 - 14:45 (Dr. Ricardo)\n• 16:00 - 17:00 (Dra. Cláudia)\n• 18:15 - 19:15 (Dr. Ricardo)\n\nQual horário prefere?",
  sabado: "No sábado temos os seguintes horários disponíveis:\n\n• 08:30 - 09:30 (Dr. Ricardo)\n• 10:00 - 11:00 (Dra. Cláudia)\n• 11:30 - 12:30 (Dra. Patrícia)\n• 13:00 - 14:00 (Dr. Ricardo)\n• 14:30 - 15:30 (Dra. Cláudia)\n\nQual horário seria ideal para você?",
  
  // Duração dos procedimentos
  duracao_limpeza: "Nossa limpeza dental profissional dura aproximadamente 45 minutos. É um procedimento tranquilo e indolor, com resultados imediatos! ✨ Quer agendar uma sessão?",
  duracao_clareamento: "O procedimento de clareamento em consultório dura cerca de 1 hora e 30 minutos. Em uma única sessão, você já consegue ver a diferença! 😁 Para casos mais complexos, pode ser necessária uma segunda sessão. Quer agendar?",
  duracao_canal: "O tratamento de canal geralmente leva entre 1 hora e 1 hora e 30 minutos por sessão. Na maioria dos casos, são necessárias 1 ou 2 sessões, dependendo da complexidade. Não se preocupe, usamos anestesia moderna para seu total conforto! 💉✨",
  duracao_extracao: "A extração simples de dente leva cerca de 30 a 45 minutos, incluindo o tempo de anestesia. Para o siso, pode durar entre 45 minutos e 1 hora. Temos profissionais especializados que realizam o procedimento com o máximo de cuidado e conforto! 🦷",
  duracao_botox: "A aplicação de Botox é super rápida, em torno de 30 minutos. O procedimento é minimamente invasivo e o resultado começa a aparecer em 3 a 5 dias, com efeito completo em 15 dias! 💉✨ Quer agendar sua aplicação?",
  duracao_preenchimento: "O procedimento de preenchimento labial dura aproximadamente 45 minutos a 1 hora. O resultado é imediato e continua melhorando nos dias seguintes! Usamos produtos de alta qualidade para um resultado natural. 💋",
  
  // Perguntas sobre a clínica
  estacionamento: "Sim, temos estacionamento próprio, gratuito para clientes durante o atendimento! 🚗 Além disso, estamos bem localizados, próximos a pontos de ônibus e metrô. Fácil de chegar de qualquer forma! Como prefere vir?",
  wifi: "Sim, oferecemos Wi-Fi gratuito para todos os nossos pacientes! 📱 A senha é fornecida na recepção. Queremos que você se sinta à vontade durante todo o tempo que estiver conosco!",
  acompanhante: "Claro que pode trazer acompanhante! 👨‍👩‍👧 Temos uma sala de espera confortável com café, água e revistas. Para procedimentos mais complexos, como extrações, sempre recomendamos vir acompanhado(a). Podemos agendar seu horário?",
  
  // Emergências
  emergencia: "Sim, atendemos emergências dentárias! 🚨 Reserve uma hora em nossa agenda todos os dias para casos urgentes. Dor de dente, restauração quebrada, trauma dental - estamos aqui para ajudar! Qual é a sua situação? Podemos te encaixar hoje!",
  
  // Convênios
  convenio: "Atualmente trabalhamos com os seguintes convênios: Amil, Bradesco Saúde, Sul América, Unimed e Odontoprev. 💳 Oferecemos também nosso plano próprio de fidelidade com descontos especiais! Gostaria de saber mais sobre algum deles?",
  
  // Novas respostas para objeções de vendas
  expensive: "Entendo sua preocupação com os valores! 💙\n\nMas veja bem, investir na sua saúde bucal e autoestima é um dos melhores investimentos que você pode fazer. E temos várias opções para facilitar:\n\n✅ Parcelamento em até 12x sem juros\n✅ Descontos para pacotes de tratamento\n✅ Primeira avaliação totalmente gratuita\n\nQual opção se encaixa melhor no seu orçamento? Podemos encontrar uma solução personalizada para você! 😊",
  expensive_alt: "Compreendo completamente! 💯\n\nMas sabia que oferecemos o melhor custo-benefício da região? Nossos tratamentos têm garantia e usamos materiais de altíssima qualidade que duram muito mais.\n\nAlém disso, para novos pacientes, estamos com um desconto especial de 10% no primeiro procedimento!\n\nPosso te mostrar algumas opções que cabem no seu bolso? 💸",
  expensive_extra: "Posso entender sua preocupação! 😊\n\nMas olha só: trabalhamos com planos personalizados que se adaptam à sua realidade financeira. E muitas vezes o que parece mais caro acaba sendo mais econômico a longo prazo!\n\nQue tal conversarmos sobre as diferentes opções de pagamento? Tenho certeza que encontraremos a solução ideal para você! ✨",
  compare_prices: "Entendo que você esteja pesquisando preços! É muito importante mesmo! 👍\n\nMas além do valor, considere também a qualidade e experiência dos profissionais. Nossa equipe tem especialização internacional e usamos tecnologias que muitas clínicas nem oferecem.\n\nSe você encontrou um orçamento menor, podemos analisar e tentar igualar para não perdermos você! 💕 Posso fazer uma proposta especial?",
  no_money: "Entendo esse momento! 💙\n\nJustamente por isso temos opções flexíveis de pagamento que podem caber no seu orçamento atual. Para casos como o seu, podemos oferecer um desconto especial de 15% e parcelamento estendido.\n\nE lembre-se: adiar cuidados dentários muitas vezes significa tratamentos mais caros no futuro. Que tal pelo menos fazer uma avaliação gratuita para saber suas opções?",
  no_money_alt: "Momentos financeiros apertados acontecem com todos nós! 💪\n\nPor isso mesmo temos condições especiais pensando em situações como a sua. Que tal começarmos com uma avaliação gratuita?\n\nDepois, podemos montar um plano de tratamento em fases, priorizando o mais urgente agora e deixando o resto para quando estiver mais tranquilo financeiramente. O que acha?",
  looking_elsewhere: "Entendo que você esteja avaliando outras opções, isso é muito prudente! 👏\n\nMas antes de decidir, gostaria de destacar nossos diferenciais:\n\n✨ Garantia em todos os tratamentos\n✨ Profissionais premiados internacionalmente\n✨ Tecnologia exclusiva que reduz desconforto\n✨ Atendimento humanizado e personalizado\n\nPara que você possa comparar adequadamente, que tal agendar uma avaliação gratuita sem compromisso?",
  looking_elsewhere_alt: "Comparar é sempre importante! 😊\n\nMas quero garantir que você tenha todas as informações para uma decisão justa. Muitos de nossos pacientes vieram de outras clínicas buscando a qualidade que oferecemos.\n\nO que você está buscando especificamente? Talvez eu possa mostrar como atendemos essa necessidade de forma única! ✨",
  too_far: "Entendo a preocupação com a distância! 🗺️\n\nMas muitos pacientes vêm de longe justamente pela qualidade do nosso atendimento. Um pequeno deslocamento por um tratamento excepcional vale a pena, não acha?\n\nAlém disso, concentramos seus procedimentos para minimizar o número de visitas. E para novos pacientes que vêm de longe, oferecemos 10% de desconto no primeiro tratamento! Isso ajuda?",
  thinking_about_it: "Claro, decisões importantes merecem reflexão! 💭\n\nEnquanto você pensa, posso enviar mais informações sobre o procedimento que te interessa? Ou talvez tirar alguma dúvida específica?\n\nLembre-se que a avaliação inicial é totalmente gratuita e sem compromisso. Você conhece nossa clínica, conversa com o profissional e depois decide com calma! Quando seria um bom momento para você?",
  thinking_about_it_alt: "Tomar tempo para decidir é muito sábio! ✨\n\nQueria apenas garantir que você tem todas as informações necessárias. Existe alguma dúvida que eu possa esclarecer ou alguma preocupação específica?\n\nE lembre-se: nossas vagas para avaliação gratuita são limitadas. Se quiser garantir a sua enquanto decide, posso reservar sem compromisso! 📅",
  not_priority: "Entendo que existem muitas prioridades na vida! 💫\n\nMas sabia que problemas bucais não tratados podem afetar sua saúde geral e acabar custando muito mais no futuro?\n\nQue tal pelo menos fazer a avaliação gratuita para conhecer sua situação atual? Sem compromisso, apenas para você ter clareza do que precisa ser priorizado ou não. O que acha?",
  not_priority_alt: "Respeito totalmente suas prioridades atuais! 🙌\n\nMas é interessante considerar que muitos problemas dentários são silenciosos no início e podem se tornar mais graves (e caros) com o tempo.\n\nPodemos começar com o básico - uma limpeza profissional talvez? É rápido, acessível e mantém sua saúde bucal enquanto você planeja os próximos passos. Temos horários flexíveis para encaixar na sua rotina!",
  afraid: "Medo de dentista é muito mais comum do que você imagina! 💕\n\nNossa clínica é especializada em pacientes ansiosos e com trauma. Temos técnicas específicas que tornam o atendimento muito mais tranquilo:\n\n• Anestesia indolor com aplicação de anestésico tópico antes\n• Ambiente relaxante com música e aromaterapia\n• Sedação leve para procedimentos mais complexos\n• Atendimento no seu ritmo, sem pressão\n\nQue tal conhecer nossa abordagem com uma visita sem procedimentos? Só para você se sentir confortável com o ambiente!",
  afraid_alt: "Seu medo é totalmente compreensível e respeitamos muito isso! 🫶\n\nSabia que grande parte da nossa equipe escolheu odontologia justamente por ter passado por experiências traumáticas e querer mudar essa realidade?\n\nTemos pacientes que chegaram aqui sem conseguir sequer sentar na cadeira e hoje fazem tratamentos completos relaxados. A transformação começa com pequenos passos!\n\nPosso marcar um horário especial só para você conhecer o consultório, sem qualquer procedimento? Seria o primeiro passo!"
};

// Respostas de diferencial - usadas para variar as mensagens sobre por que escolher a clínica
const CLINIC_ADVANTAGES = [
  "Porque aqui você não é só mais um paciente, você é único para nós! 💖\nNossa missão é transformar vidas com carinho, responsabilidade e resultados incríveis! ✨\nTemos profissionais premiados, tecnologia de ponta e o atendimento mais humano que você vai encontrar! 🏆\nSeu sorriso e sua autoestima merecem o melhor... e o melhor está aqui! 😍\n\nQuer agendar uma avaliação GRATUITA hoje mesmo e garantir 10% de desconto no seu primeiro procedimento? 💸",
  
  "Porque a gente entrega o que promete: resultados de alta qualidade sem pesar no seu bolso! 💳💥\nVocê pode parcelar tudo em até 12X SEM JUROS, com preços justos e ofertas exclusivas para quem fecha hoje!\nTudo isso feito por profissionais experientes e apaixonados pelo que fazem!\nNão perca tempo! Nossos horários estão acabando rápido! 🕒 Posso reservar o seu?",
  
  "Porque você merece se olhar no espelho e se sentir incrível todos os dias! 💖\nA nossa clínica é especializada em transformar autoestima, com procedimentos seguros, modernos e personalizados para você!\nLembre-se: investir no seu sorriso não é gasto, é INVESTIMENTO que dura para sempre! ✅\nAproveite nossa promoção desta semana e garanta 15% OFF! Posso agendar para quando?",
  
  "Porque somos especialistas em entregar qualidade, segurança e atendimento humanizado! 👩‍⚕️👨‍⚕️\nTemos estrutura moderna, profissionais certificados e preços que cabem no seu bolso com facilidade no pagamento! 💳\nSe você busca ser tratado(a) com respeito e atenção, então já encontrou o lugar certo! 🎯\nLIGUE HOJE e ganhe uma análise facial completa totalmente GRÁTIS! O que acha de aproveitar?",
  
  "Porque aqui o seu sorriso é levado a sério, mas o atendimento é leve e cheio de alegria! 😁✨\nCuidar de você é um privilégio para a nossa equipe!\nAlém disso, temos descontos exclusivos, parcelamento sem estresse e uma GARANTIA em todos os procedimentos que nenhuma outra clínica oferece! 💯\nVamos agendar seu horário? Os slots dessa semana estão se esgotando! ⏰"
];

// Sugestões de respostas inteligentes - baseadas em contexto
const AI_SUGGESTIONS: Record<string, AISuggestion[]> = {
  initial: [
    { id: 'sug_1', text: 'Quais serviços vocês oferecem?', type: 'general' },
    { id: 'sug_2', text: 'Qual o horário de funcionamento?', type: 'appointment' },
    { id: 'sug_3', text: 'Quero agendar uma consulta', type: 'appointment' }
  ],
  services: [
    { id: 'sug_srv_1', text: 'Quero saber mais sobre clareamento', type: 'service' },
    { id: 'sug_srv_2', text: 'Preciso extrair o siso', type: 'service' },
    { id: 'sug_srv_3', text: 'Quanto custa o botox?', type: 'service' },
    { id: 'sug_srv_4', text: 'Como é feita a limpeza?', type: 'service' }
  ],
  pricing: [
    { id: 'sug_price_1', text: 'É possível parcelar?', type: 'payment' },
    { id: 'sug_price_2', text: 'Vocês aceitam PIX?', type: 'payment' },
    { id: 'sug_price_3', text: 'Tem desconto para pacote?', type: 'discount' },
    { id: 'sug_price_4', text: 'Está um pouco caro pra mim', type: 'discount' }
  ],
  appointment: [
    { id: 'sug_apt_1', text: 'Tem horário na segunda-feira?', type: 'appointment' },
    { id: 'sug_apt_2', text: 'Quanto tempo dura o clareamento?', type: 'service' },
    { id: 'sug_apt_3', text: 'Vocês atendem no sábado?', type: 'appointment' },
    { id: 'sug_apt_4', text: 'Tem estacionamento?', type: 'general' }
  ],
  fear: [
    { id: 'sug_fear_1', text: 'Tenho muito medo de dentista', type: 'general' },
    { id: 'sug_fear_2', text: 'Dói fazer tratamento de canal?', type: 'service' },
    { id: 'sug_fear_3', text: 'Como funciona a anestesia?', type: 'service' },
    { id: 'sug_fear_4', text: 'Posso levar acompanhante?', type: 'general' }
  ],
  aesthetics: [
    { id: 'sug_aes_1', text: 'Quanto tempo dura o botox?', type: 'service' },
    { id: 'sug_aes_2', text: 'O preenchimento é dolorido?', type: 'service' },
    { id: 'sug_aes_3', text: 'Quero melhorar meu sorriso', type: 'service' },
    { id: 'sug_aes_4', text: 'Tenho manchas nos dentes', type: 'service' }
  ],
  schedule: [
    { id: 'sug_sch_1', text: 'Horários disponíveis na segunda?', type: 'appointment' },
    { id: 'sug_sch_2', text: 'Tem horário na quarta-feira?', type: 'appointment' },
    { id: 'sug_sch_3', text: 'Vocês atendem no sábado?', type: 'appointment' },
    { id: 'sug_sch_4', text: 'Qual é o horário de atendimento?', type: 'appointment' }
  ],
  duration: [
    { id: 'sug_dur_1', text: 'Quanto tempo dura a limpeza?', type: 'service' },
    { id: 'sug_dur_2', text: 'Qual a duração da extração do siso?', type: 'service' },
    { id: 'sug_dur_3', text: 'Quanto tempo demora o clareamento?', type: 'service' },
    { id: 'sug_dur_4', text: 'Quanto tempo para fazer canal?', type: 'service' }
  ],
  emergency: [
    { id: 'sug_emrg_1', text: 'Estou com muita dor de dente', type: 'appointment' },
    { id: 'sug_emrg_2', text: 'Meu dente quebrou, vocês atendem hoje?', type: 'appointment' },
    { id: 'sug_emrg_3', text: 'Vocês têm atendimento de emergência?', type: 'appointment' },
    { id: 'sug_emrg_4', text: 'Preciso de um dentista urgente', type: 'appointment' }
  ]
};

// Lista de perguntas frequentes
const FREQUENT_QUESTIONS = [
  "Quanto custa o clareamento dental?",
  "Como funciona o pagamento?",
  "Vocês atendem nos finais de semana?",
  "Preciso marcar horário para avaliação?",
  "Quanto tempo dura uma limpeza?",
  "Vocês têm emergência?",
  "O aparelho invisível é confortável?",
  "Posso parcelar o tratamento?",
  "Vocês aceitam convênio?",
  "Quanto tempo dura o efeito do botox?"
];

// Palavras-chave e suas respostas
const KEYWORDS: Record<string, string> = {
  // Dentistas
  "siso": RESPONSES.siso,
  "juízo": RESPONSES.siso,
  "clareamento": RESPONSES.clareamento,
  "branqueamento": RESPONSES.clareamento,
  "branquinho": RESPONSES.clareamento,
  "canal": "Fazer canal hoje em dia é super tranquilo! 😌\nUsamos técnicas modernas para garantir seu conforto. O tratamento de canal custa R$ 500 e pode ser parcelado. Quando podemos agendar para você?",
  "limpeza": "Uma limpeza profissional deixa seu sorriso muito mais bonito e saudável! ✨\nO procedimento custa R$ 120 e dura aproximadamente 40 minutos. Quer marcar para essa semana?",
  "aparelho": "Temos diversas opções de aparelhos ortodônticos! 😁\nDesde os tradicionais até os mais discretos. A manutenção mensal custa R$ 180. Podemos agendar uma avaliação gratuita para ver a melhor opção para você!",
  "invisível": "Sim, trabalhamos com alinhadores invisíveis! 👌\nSão discretos, confortáveis e removíveis! O valor do tratamento completo começa em R$ 4.500, parcelado em até 12x sem juros. Quer saber se é indicado para o seu caso?",
  "bruxismo": RESPONSES.bruxismo,
  "ranger": RESPONSES.bruxismo,
  "sensibilidade": "Entendo sua preocupação com a sensibilidade dental! 😔\nTemos tratamentos específicos que aliviam esse desconforto. Custa R$ 180 e o resultado é imediato! Gostaria de agendar?",
  "cárie": "Podemos tratar suas cáries com restaurações da cor do dente, super naturais! 😉\nO valor da restauração simples é R$ 250. E o melhor: sem dor! Quando podemos agendar?",
  "implante": "Os implantes dentários são a melhor solução para substituir dentes perdidos! 🦷\nSão feitos de titânio e parecem totalmente naturais. O valor do implante é R$ 1.800, parcelado em até 12x. Quer uma avaliação?",
  "extração": "Nossa equipe é especializada em extrações com o mínimo de desconforto! 👨‍⚕️\nUsamos anestesia de última geração para seu conforto. O valor varia de R$ 200 a R$ 350, dependendo da complexidade. Podemos agendar?",
  
  // Harmonização Facial
  "botox": "Nosso Botox é aplicado com técnica que garante expressões naturais! 💉✨\nO procedimento custa R$ 500 por região e o efeito dura em média 6 meses. Quer agendar uma avaliação gratuita?",
  "preenchimento": "O preenchimento labial deixa seus lábios mais volumosos e definidos! 💋\nUsamos ácido hialurônico de alta qualidade e o efeito dura cerca de 1 ano. O valor é R$ 650. Interessada?",
  "facial": "Nossa harmonização facial é personalizada para valorizar seus traços naturais! 👄✨\nO valor varia conforme as áreas tratadas, começando em R$ 800. Podemos fazer uma avaliação gratuita para criar um plano para você?",
  "bichectomia": "A bichectomia afia o contorno do rosto, destacando as maçãs do rosto! 😍\nO procedimento custa R$ 1.200 e tem resultados permanentes. Quer saber mais detalhes?",
  "papada": "Temos tratamentos específicos para papada, como aplicação de enzimas e tecnologias não invasivas! 👍\nO valor começa em R$ 600 por sessão. Quer conhecer as opções disponíveis para você?",
  
  // Pagamentos e preços
  "preço": RESPONSES.services,
  "valor": RESPONSES.services,
  "custa": RESPONSES.services,
  "cartão": RESPONSES.payment,
  "parcela": RESPONSES.payment,
  "débito": "Aceitamos cartões de débito SIM! 💳\nInfelizmente NÃO oferecemos desconto nessa modalidade, MAS nossos preços já são EXTREMAMENTE COMPETITIVOS! O valor do tratamento é o MELHOR CUSTO-BENEFÍCIO do mercado - materiais IMPORTADOS e profissionais RENOMADOS!\n\nNão perca tempo com clínicas que usam materiais de baixa qualidade! Agende AGORA MESMO! 🔥",
  
  "débito_alt": "Cartão de débito é MUITO BEM-VINDO! 💳\nNão temos desconto para débito, MAS TEMOS UMA QUALIDADE INCOMPARÁVEL! Enquanto outras clínicas oferecem descontos e usam materiais inferiores, nós GARANTIMOS o MELHOR RESULTADO POSSÍVEL!\n\nAPROVEITE nossa PROMOÇÃO RELÂMPAGO: Agende HOJE para qualquer procedimento e ganhe uma AVALIAÇÃO COMPLETA + KIT DENTAL PREMIUM! Vagas LIMITADÍSSIMAS! ⏰",
  
  "débito_alt2": "Sim, aceitamos débito sem problema! 💳\nApesar de não termos desconto nessa forma de pagamento, posso GARANTIR: Você NÃO VAI ENCONTRAR melhor qualidade pelo mesmo preço em LUGAR NENHUM!\n\nNossos dentistas são REFERÊNCIA NACIONAL e usamos equipamentos DIGITAIS DE ÚLTIMA GERAÇÃO!\n\nVamos agendar seu horário HOJE? Estamos com POUCAS VAGAS disponíveis! 📅",
  
  "crédito": "ÓTIMA ESCOLHA! 💳 Aceitamos TODOS os cartões de crédito e parcelamos em até 12x SEM JUROS!\n\nIsso significa que você pode começar seu tratamento HOJE MESMO e dividir em parcelas PEQUENAS que cabem no seu orçamento!\n\nIMAGINE sair daqui HOJE com seu tratamento iniciado pagando uma pequena parcela! Nossos horários estão ACABANDO RÁPIDO! Posso reservar o seu? ⏰",
  
  "crédito_alt": "SUPER VANTAJOSO! 💳✨ Parcelamos em até 12x SEM JUROS e SEM ENTRADA! Isso significa que você sai com o sorriso novo HOJE, mas só começa a pagar no PRÓXIMO MÊS!\n\nMelhor ainda: Temos APROVAÇÃO IMEDIATA e você já sai com o tratamento AGENDADO!\n\nNão jogue dinheiro fora em clínicas medianas... INVISTA no seu melhor SORRISO! Quando podemos agendar? 📆",
  
  "crédito_alt2": "EXCELENTE PEDIDA! 💳 Com crédito você parcela em até 12x SEM JUROS, mas aproveita os benefícios IMEDIATAMENTE!\n\nNossa EXCLUSIVIDADE: Tratamentos com garantia de até 5 ANOS por escrito! Nenhuma outra clínica oferece isso!\n\nAGENDE AGORA e ganhe PONTOS FIDELIDADE que podem ser trocados por procedimentos GRATUITOS! Esta promoção termina HOJE! 🏆",
  
  "pagamento": "Temos TODAS as opções para facilitar sua vida! 💸\n\n• Dinheiro: 5% de DESCONTO IMEDIATO!\n• Cartão de crédito: 12x SEM JUROS!\n• Débito e PIX: Praticidade e rapidez\n\nALÉM DISSO, para pagamentos FECHADOS HOJE, você ganha um CHECK-UP COMPLETO + LIMPEZA PROFISSIONAL totalmente GRATUITOS!\n\nQual opção é melhor para você? Podemos RESERVAR SEU HORÁRIO AGORA! ⏰",
  
  "pagamento_alt": "Facilitamos ao MÁXIMO para você! 💰\n\n• DINHEIRO: Desconto ESPECIAL de 5%\n• CRÉDITO: Parcele em 12x SEM JUROS!\n• Aceitamos TODOS os cartões e PIX\n\nTemos também nosso PLANO EXCLUSIVO com mensalidades a partir de R$59,90 que incluem CONSULTAS ILIMITADAS!\n\nQuer ECONOMIZAR e ter o MELHOR SORRISO ao mesmo tempo? Vamos agendar HOJE? 📱",
  "pix": "Sim, aceitamos PIX! 📱 É prático, seguro e super rápido!\nInfelizmente NÃO oferecemos desconto para pagamento via PIX, mas garanto que a QUALIDADE do nosso atendimento compensa qualquer desconto! 💯\nNossos valores já são SUPER COMPETITIVOS e nossa equipe é formada pelos MELHORES PROFISSIONAIS do mercado!\n\nQuer agendar seu horário hoje? Posso reservar uma vaga ESPECIAL para você! ⏰",
  
  "pix_alt": "Aceitamos PIX sim! 📲 NÃO oferecemos desconto para esta modalidade, MAS o que economizamos em taxas INVESTIMOS em materiais de ALTÍSSIMA QUALIDADE que garantem RESULTADOS SUPERIORES e mais DURADOUROS! 🏆\nNossos pacientes sempre saem satisfeitos independente da forma de pagamento! Posso garantir seu horário ainda hoje?",
  
  "pix_alt2": "Claro que aceitamos PIX! 💸 E embora não tenhamos desconto para este método, você já está economizando ao escolher nossa clínica - temos os MELHORES PREÇOS da região para a QUALIDADE que oferecemos! ✨\nAproveite para agendar HOJE mesmo e garanta uma AVALIAÇÃO GRATUITA! Os horários estão preenchendo rapidamente! 🕒",
  
  "dinheiro_pagamento": "Sim, aceitamos pagamento em dinheiro! 💵\nPara pagamentos À VISTA EM DINHEIRO, oferecemos um DESCONTO ESPECIAL DE 5%! Também aceitamos PIX e cartões se for mais conveniente.\n\nRECOMENDO FORTEMENTE o pagamento em dinheiro para você MAXIMIZAR SUA ECONOMIA! 💰 Posso reservar seu horário agora mesmo?",
  
  "dinheiro_pagamento_alt": "ÓTIMA ESCOLHA! 💵 Pagamento em dinheiro tem DESCONTO EXCLUSIVO DE 5%! É nossa forma de agradecer e eliminar taxas bancárias!\n\nINVESTIR no seu sorriso com este desconto é uma DECISÃO INTELIGENTE! Nossos resultados são GARANTIDOS e você ainda economiza! 🤑\n\nAproveite esta condição ESPECIAL! Posso reservar seu horário HOJE?",
  
  "dinheiro_pagamento_alt2": "Claro que aceitamos dinheiro! E MELHOR AINDA: você ganha 5% de DESCONTO IMEDIATO! 💸\n\nEstamos com uma PROMOÇÃO RELÂMPAGO: pagando em dinheiro HOJE, além dos 5%, você ganha uma SESSÃO DE LIMPEZA GRATUITA no próximo retorno! OFERTA VÁLIDA SOMENTE HOJE! ⏰\n\nQuer aproveitar esta condição EXCLUSIVA?",
  
  // Horários de Funcionamento
  "horário funcionamento": RESPONSES.horarios, 
  "horário atendimento": RESPONSES.horarios,
  "horários disponíveis": RESPONSES.horarios,
  "quando atendem": RESPONSES.horarios,
  "que horas": RESPONSES.horarios,
  "aberto": RESPONSES.horarios,
  "fechado": RESPONSES.horarios,
  "fim de semana": RESPONSES.horarios,
  "domingo": "Aos domingos nossa clínica está fechada para descanso da equipe. Atendemos de segunda a sexta das 9h às 21h e aos sábados das 8h às 16h. Podemos agendar um horário em um desses dias para você?",
  "sábado": RESPONSES.sabado,
  "segunda": RESPONSES.segunda,
  "terça": RESPONSES.terca,
  "quarta": RESPONSES.quarta,
  "quinta": RESPONSES.quinta,
  "sexta": RESPONSES.sexta,
  
  // Duração dos procedimentos
  "tempo limpeza": RESPONSES.duracao_limpeza,
  "duração limpeza": RESPONSES.duracao_limpeza,
  "quanto tempo limpeza": RESPONSES.duracao_limpeza,
  "tempo clareamento": RESPONSES.duracao_clareamento,
  "duração clareamento": RESPONSES.duracao_clareamento,
  "quanto tempo clareamento": RESPONSES.duracao_clareamento,
  "tempo canal": RESPONSES.duracao_canal,
  "duração canal": RESPONSES.duracao_canal,
  "quanto tempo canal": RESPONSES.duracao_canal,
  "tempo extração": RESPONSES.duracao_extracao,
  "duração extração": RESPONSES.duracao_extracao,
  "quanto tempo extração": RESPONSES.duracao_extracao,
  "tempo botox": RESPONSES.duracao_botox,
  "duração botox": RESPONSES.duracao_botox,
  "quanto tempo botox": RESPONSES.duracao_botox,
  "tempo preenchimento": RESPONSES.duracao_preenchimento,
  "duração preenchimento": RESPONSES.duracao_preenchimento,
  "quanto tempo preenchimento": RESPONSES.duracao_preenchimento,
  
  // Perguntas frequentes sobre a clínica
  "estacionamento": RESPONSES.estacionamento,
  "carro": RESPONSES.estacionamento,
  "estacionar": RESPONSES.estacionamento,
  "wifi": RESPONSES.wifi,
  "internet": RESPONSES.wifi,
  "acompanhante": RESPONSES.acompanhante,
  "acompanhar": RESPONSES.acompanhante,
  "emergência": RESPONSES.emergencia,
  "urgência": RESPONSES.emergencia,
  "urgente": RESPONSES.emergencia,
  "dor forte": RESPONSES.emergencia,
  "quebrou": RESPONSES.emergencia,
  "convênio": RESPONSES.convenio,
  "plano": RESPONSES.convenio,
  
  // Sentimentos
  "bem": RESPONSES.positive,
  "feliz": RESPONSES.positive,
  "ótimo": RESPONSES.positive,
  "ótima": RESPONSES.positive,
  "mal": RESPONSES.negative,
  "triste": RESPONSES.negative,
  "péssimo": RESPONSES.negative,
  "péssima": RESPONSES.negative,
  "ruim": RESPONSES.negative,
  "cansado": RESPONSES.negative,
  "cansada": RESPONSES.negative,
  
  // Diferencial - vamos variar as respostas
  "por que": RESPONSES.advantages,
  "vantagem": RESPONSES.advantages,
  "diferencial": RESPONSES.advantages,
  "melhor": RESPONSES.advantages,
  
  // Dúvidas e traumas
  "dor": "Fique tranquilo(a), trabalhamos com anestesia moderna e técnicas suaves! 😌\nNosso objetivo é zero desconforto durante os procedimentos. Podemos agendar uma consulta para você conhecer nossa abordagem?",
  "trauma": "Entendemos totalmente! 💕\nNossa clínica é especializada em atender pacientes com trauma de dentista. Vamos no seu ritmo, com muito carinho e paciência. Quer dar uma chance para nós?",
  
  // Agendamento
  "agendar": RESPONSES.schedule,
  "marcar": RESPONSES.schedule,
  "consulta": RESPONSES.schedule,
  "horário": RESPONSES.schedule,
  "avaliação": RESPONSES.schedule,
  
  // Objeções de vendas
  "caro": RESPONSES.expensive,
  "cara": RESPONSES.expensive,
  "preços_alt": RESPONSES.compare_prices,
  "comparando_precos": RESPONSES.compare_prices,
  "pesquisando": RESPONSES.compare_prices,
  "orçamento": RESPONSES.compare_prices,
  "dinheiro_falta": RESPONSES.no_money,
  "não tenho": RESPONSES.no_money,
  "sem grana": RESPONSES.no_money_alt,
  "apertado": RESPONSES.no_money_alt,
  "outra clínica": RESPONSES.looking_elsewhere,
  "estou vendo": RESPONSES.looking_elsewhere,
  "comparando_clinica": RESPONSES.looking_elsewhere_alt,
  "longe": RESPONSES.too_far,
  "distante": RESPONSES.too_far,
  "pensar": RESPONSES.thinking_about_it,
  "vou pensar": RESPONSES.thinking_about_it,
  "refletir": RESPONSES.thinking_about_it_alt,
  "decidir": RESPONSES.thinking_about_it_alt,
  "prioridade": RESPONSES.not_priority,
  "agora não": RESPONSES.not_priority,
  "momento": RESPONSES.not_priority_alt,
  "medo_dentista": RESPONSES.afraid,
  "receio": RESPONSES.afraid_alt,
  "pavor": RESPONSES.afraid,
  "ansiedade": RESPONSES.afraid_alt,
};

// Componente de Chatbot
export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionsType, setSuggestionsType] = useState<string>("initial");
  const [chatContext, setChatContext] = useState<ChatContext>({
    lastInteraction: new Date(),
    hasGivenDiscount: false,
    discountAmount: 0,
    sentimentDetected: 'neutral',
    needsFollowUp: false,
    followUpTime: null,
    mentionedPrice: false,
    mentionedFamilyLoss: false,
    paymentMethod: null,
    interestedInService: null,
    hasSevereMentalState: false,
    recentTopics: [],
    frequentQuestions: []
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeito para inicializar o chatbot com uma mensagem de boas-vindas
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-message",
          sender: "bot",
          content: RESPONSES.greeting,
          timestamp: new Date(),
        }
      ]);
      
      // Inicializa as sugestões de IA
      setCurrentSuggestions(AI_SUGGESTIONS.initial);
    }
    
    // Configurar timer de inatividade inicial
    resetInactivityTimer();
    
    // Limpar o timer quando o componente for desmontado
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, []);

  // Função para reiniciar o timer de inatividade
  const resetInactivityTimer = () => {
    // Limpar timer atual se existir
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    // Configurar novo timer de 5 minutos
    const timer = setTimeout(() => {
      handleInactivity();
    }, 5 * 60 * 1000); // 5 minutos
    
    setInactivityTimer(timer);
  };

  // Função para lidar com inatividade
  const handleInactivity = () => {
    if (messages.length > 1 && isOpen) {
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        content: RESPONSES.inactivity,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Configurar outro timer para encerrar a conversa após mais 1 minuto
      setTimeout(() => {
        handleGoodbye();
      }, 1 * 60 * 1000); // 1 minuto
    }
  };

  // Função para encerrar a conversa educadamente
  const handleGoodbye = () => {
    if (isOpen) {
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        content: RESPONSES.goodbye,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Opcional: fechar o chat após alguns segundos
      setTimeout(() => {
        setIsOpen(false);
      }, 10 * 1000); // 10 segundos
    }
  };

  // Rola para a mensagem mais recente e atualiza sugestões de IA
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Atualizar o tempo da última interação para mensagens do bot
    if (messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
      setChatContext(prev => ({
        ...prev,
        lastInteraction: new Date()
      }));
      
      // Resetar o timer de inatividade
      resetInactivityTimer();
      
      // Gerar novas sugestões de IA com base no contexto atual
      updateAISuggestions();
    }
  }, [messages]);
  
  // Função para atualizar sugestões de IA baseadas no contexto da conversa
  const updateAISuggestions = useCallback(() => {
    let newSuggestionsType = "initial";
    
    // Analisar mensagens recentes (últimas 3)
    const recentMessages = messages.slice(-3);
    const recentContent = recentMessages.map(m => m.content.toLowerCase()).join(' ');
    
    // Determinar o tipo de sugestões com base no contexto
    
    // Palavras relacionadas a horários
    if (recentContent.includes("horário") || 
        recentContent.includes("quando") || 
        recentContent.includes("atendimento") || 
        recentContent.includes("segunda") || 
        recentContent.includes("terça") || 
        recentContent.includes("quarta") || 
        recentContent.includes("quinta") || 
        recentContent.includes("sexta") || 
        recentContent.includes("sábado") || 
        recentContent.includes("domingo")) {
      newSuggestionsType = "schedule";
    }
    // Palavras relacionadas a duração de procedimentos
    else if (recentContent.includes("duração") || 
             recentContent.includes("quanto tempo") || 
             recentContent.includes("demora") || 
             recentContent.includes("leva quanto tempo") || 
             recentContent.includes("sessão") || 
             recentContent.includes("minutos") || 
             recentContent.includes("horas")) {
      newSuggestionsType = "duration";
    }
    // Palavras relacionadas a emergências
    else if (recentContent.includes("emergência") || 
             recentContent.includes("urgente") || 
             recentContent.includes("dor forte") || 
             recentContent.includes("quebrou") || 
             recentContent.includes("acidente") || 
             recentContent.includes("sangramento")) {
      newSuggestionsType = "emergency";
    }
    // Interesse em serviços específicos
    else if (chatContext.interestedInService) {
      if (chatContext.interestedInService.includes("siso") || 
          chatContext.interestedInService.includes("canal") ||
          chatContext.interestedInService.includes("implante") ||
          chatContext.interestedInService.includes("restauração")) {
        newSuggestionsType = "services";
      } else if (chatContext.interestedInService.includes("clareamento") ||
                 chatContext.interestedInService.includes("estética") ||
                 chatContext.interestedInService.includes("botox") ||
                 chatContext.interestedInService.includes("preenchimento")) {
        newSuggestionsType = "aesthetics";
      }
    } 
    // Menções a preços e descontos
    else if (chatContext.mentionedPrice || chatContext.hasGivenDiscount || 
             recentContent.includes("preço") || 
             recentContent.includes("valor") || 
             recentContent.includes("custa") || 
             recentContent.includes("pagar") || 
             recentContent.includes("parcelar")) {
      newSuggestionsType = "pricing";
    } 
    // Questões relacionadas a medo e ansiedade
    else if (recentContent.includes("medo") || 
             recentContent.includes("receio") ||
             recentContent.includes("trauma") ||
             recentContent.includes("ansiedade") ||
             recentContent.includes("pavor") ||
             recentContent.includes("nervoso") ||
             recentContent.includes("nervosa")) {
      newSuggestionsType = "fear";
    } 
    // Agendamentos e consultas
    else if (recentContent.includes("agendar") || 
             recentContent.includes("marcar") ||
             recentContent.includes("consulta") ||
             recentContent.includes("horário")) {
      newSuggestionsType = "appointment";
    }
    
    // Se o tipo mudou, atualizar sugestões
    if (newSuggestionsType !== suggestionsType) {
      setSuggestionsType(newSuggestionsType);
      setCurrentSuggestions(AI_SUGGESTIONS[newSuggestionsType]);
    }
    
    // Adicionar uma sugestão personalizada com base no histórico
    if (messages.length > 2 && chatContext.recentTopics.length > 0) {
      const lastTopic = chatContext.recentTopics[chatContext.recentTopics.length - 1];
      
      // Adicionar uma sugestão personalizada baseada no tópico recente
      if (lastTopic === "clareamento") {
        const customSuggestion: AISuggestion = { 
          id: `custom_${Date.now()}`, 
          text: "Quanto tempo dura o efeito do clareamento?", 
          type: "service" 
        };
        
        if (!currentSuggestions.some(s => s.text.includes("dura o efeito"))) {
          setCurrentSuggestions(prev => [...prev.slice(0, 3), customSuggestion]);
        }
      } else if (lastTopic === "payment") {
        const customSuggestion: AISuggestion = { 
          id: `custom_${Date.now()}`, 
          text: "Tem desconto para pagamento à vista?", 
          type: "payment" 
        };
        
        if (!currentSuggestions.some(s => s.text.includes("desconto"))) {
          setCurrentSuggestions(prev => [...prev.slice(0, 3), customSuggestion]);
        }
      }
    }
  }, [chatContext, messages, suggestionsType, currentSuggestions]);

  // Função para obter uma resposta de diferencial aleatória
  const getRandomAdvantage = (): string => {
    const randomIndex = Math.floor(Math.random() * CLINIC_ADVANTAGES.length);
    return CLINIC_ADVANTAGES[randomIndex];
  };

  // Função para gerar resposta baseada em palavras-chave e contexto da conversa
  const generateResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    let newContext = { ...chatContext };
    
    // Atualizar contexto com a mensagem atual
    newContext.lastInteraction = new Date();
    
    // Verifica perda familiar - oferece desconto de 15%
    if (lowerMessage.includes("perdi") && (
        lowerMessage.includes("mãe") || 
        lowerMessage.includes("pai") || 
        lowerMessage.includes("filho") || 
        lowerMessage.includes("filha") || 
        lowerMessage.includes("familiar") || 
        lowerMessage.includes("faleceu") || 
        lowerMessage.includes("falecimento") || 
        lowerMessage.includes("morreu")
      )) {
      newContext.mentionedFamilyLoss = true;
      newContext.hasGivenDiscount = true;
      newContext.discountAmount = 15;
      setChatContext(newContext);
      return "Sinto muito pela sua perda! 💔 Momentos difíceis como esse nos lembram de cuidar de nós mesmos. Para ajudar nesse momento, queremos oferecer um cupom especial de 15% de desconto em qualquer tratamento. Podemos te ajudar de alguma forma?";
    }
    
    // Detecção de estado mental severo - oferece desconto de 20% (o máximo)
    if ((lowerMessage.includes("depressão") || 
         lowerMessage.includes("depressivo") || 
         lowerMessage.includes("suicídio") || 
         lowerMessage.includes("suicida") || 
         lowerMessage.includes("muito mal") ||
         lowerMessage.includes("terrível") ||
         lowerMessage.includes("horrível") ||
         lowerMessage.includes("desesperado")) && 
        (lowerMessage.includes("sinto") || 
         lowerMessage.includes("estou") || 
         lowerMessage.includes("me sinto"))) {
      newContext.hasSevereMentalState = true;
      newContext.hasGivenDiscount = true;
      newContext.discountAmount = 20;
      setChatContext(newContext);
      return "Sinto muito que você esteja passando por esse momento tão difícil. 💙 Sua saúde mental é muito importante, e recomendo buscar apoio profissional especializado.\n\nPara apoiar você nesse momento desafiador, gostaríamos de oferecer um desconto especial de 20% em qualquer procedimento, e vamos priorizar seu bem-estar em todo o processo. Estamos aqui para ajudar. Posso agendar um horário especial para você?";
    }
    
    // Verifica objeções de preço/valor quando menciona "caro" ou similares
    if (lowerMessage.includes("caro") || 
        lowerMessage.includes("cara") || 
        lowerMessage.includes("muito caro") || 
        lowerMessage.includes("preço alto") || 
        lowerMessage.includes("valor alto") ||
        lowerMessage.includes("não tenho dinheiro") ||
        lowerMessage.includes("sem grana")) {
      
      newContext.mentionedPrice = true;
      
      // Se já ofereceu desconto, usa outra abordagem
      if (chatContext.hasGivenDiscount) {
        setChatContext(newContext);
        return Math.random() > 0.5 ? RESPONSES.expensive_alt : RESPONSES.expensive_extra;
      }
      
      // Se ainda não ofereceu desconto, oferece 10%
      newContext.hasGivenDiscount = true;
      newContext.discountAmount = 10;
      setChatContext(newContext);
      return RESPONSES.expensive;
    }
    
    // Verifica se está comparando preços ou pesquisando outras clínicas
    if (lowerMessage.includes("comparando preços") || 
        lowerMessage.includes("pesquisando") || 
        lowerMessage.includes("outras clínicas") ||
        lowerMessage.includes("outro lugar") ||
        lowerMessage.includes("vou procurar") ||
        lowerMessage.includes("mais barato")) {
      
      // Se ainda não ofereceu desconto, oferece 10%
      if (!chatContext.hasGivenDiscount) {
        newContext.hasGivenDiscount = true;
        newContext.discountAmount = 10;
        setChatContext(newContext);
        return "Entendo que você esteja comparando opções! 👍\n\nPara facilitar sua decisão, posso oferecer um desconto especial de 10% para você fechar conosco hoje. Além disso, temos parcelamento em até 12x sem juros.\n\nNossa clínica é reconhecida pela qualidade e resultados duradouros. Isso acaba sendo mais econômico a longo prazo! Posso agendar sua avaliação gratuita?";
      }
      
      // Se já ofereceu desconto, usa uma outra abordagem de convencimento
      setChatContext(newContext);
      return Math.random() > 0.5 ? RESPONSES.looking_elsewhere : RESPONSES.looking_elsewhere_alt;
    }
    
    // Detecta menções a métodos de pagamento específicos
    if (lowerMessage.includes("pix")) {
      newContext.paymentMethod = "pix";
      setChatContext(newContext);
      
      // Escolhe aleatoriamente entre as 3 variações de resposta
      const randomNum = Math.random();
      if (randomNum < 0.33) {
        return KEYWORDS["pix"];
      } else if (randomNum < 0.66) {
        return KEYWORDS["pix_alt"];
      } else {
        return KEYWORDS["pix_alt2"];
      }
    } else if (lowerMessage.includes("débito")) {
      newContext.paymentMethod = "débito";
      setChatContext(newContext);
      
      // Escolhe aleatoriamente entre as 3 variações de resposta
      const randomNum = Math.random();
      if (randomNum < 0.33) {
        return KEYWORDS["débito"];
      } else if (randomNum < 0.66) {
        return KEYWORDS["débito_alt"];
      } else {
        return KEYWORDS["débito_alt2"];
      }
    } else if (lowerMessage.includes("crédito")) {
      newContext.paymentMethod = "crédito";
      setChatContext(newContext);
      
      // Escolhe aleatoriamente entre as 3 variações de resposta
      const randomNum = Math.random();
      if (randomNum < 0.33) {
        return KEYWORDS["crédito"];
      } else if (randomNum < 0.66) {
        return KEYWORDS["crédito_alt"];
      } else {
        return KEYWORDS["crédito_alt2"];
      }
    } else if (lowerMessage.includes("dinheiro")) {
      newContext.paymentMethod = "dinheiro";
      setChatContext(newContext);
      
      // Escolhe aleatoriamente entre as 3 variações de resposta
      const randomNum = Math.random();
      if (randomNum < 0.33) {
        return KEYWORDS["dinheiro_pagamento"];
      } else if (randomNum < 0.66) {
        return KEYWORDS["dinheiro_pagamento_alt"];
      } else {
        return KEYWORDS["dinheiro_pagamento_alt2"];
      }
    } else if (lowerMessage.includes("pagamento") || lowerMessage.includes("forma de pagar") || lowerMessage.includes("como pagar")) {
      
      // Escolhe aleatoriamente entre as 2 variações de resposta
      return Math.random() < 0.5 ? KEYWORDS["pagamento"] : KEYWORDS["pagamento_alt"];
    }
    
    // Detecção de sentimentos persistentes de tristeza e oferecimento de desconto
    if ((lowerMessage === "triste" || 
         lowerMessage === "mal" || 
         lowerMessage === "péssimo" || 
         lowerMessage === "péssima" || 
         lowerMessage === "ruim" ||
         lowerMessage === "cansado" ||
         lowerMessage === "cansada" ||
         lowerMessage === "desanimado" ||
         lowerMessage === "desanimada") && 
        chatContext.sentimentDetected === 'negative') {
      
      // Se a pessoa insiste em apenas dizer palavras negativas, aumenta o desconto
      if (!chatContext.hasGivenDiscount) {
        newContext.hasGivenDiscount = true;
        newContext.discountAmount = 15;
        setChatContext(newContext);
        return "Percebo que você não está em um bom momento, e isso me preocupa. 💙\n\nQuero te oferecer algo especial: um desconto de 15% em qualquer tratamento que escolher.\n\nÀs vezes, transformar o sorriso é o primeiro passo para se sentir melhor! Podemos ajudar você nessa jornada? Que tal uma consulta para conhecer nossas opções?";
      } else if (chatContext.discountAmount < 20) {
        // Se já ofereceu desconto, mas a pessoa continua com problemas, aumenta para o máximo de 20%
        newContext.discountAmount = 20;
        setChatContext(newContext);
        return "Sinto muito que você continue se sentindo assim. 😔💕\n\nQuero fazer algo especial por você: vou aumentar seu desconto para 20% (nosso máximo!) em qualquer tratamento.\n\nAlém disso, nossos profissionais são conhecidos pelo atendimento acolhedor e humano. Podemos reservar um horário especial para você, com mais tempo e atenção. O que acha?";
      }
    }
    
    // Procura por palavras-chave específicas nas frases predefinidas
    for (const phrase of [
      "Preciso tirar o dente do juízo",
      "Meu dente tá podre",
      "Tenho que arrancar o siso",
      "Dá pra consertar meu sorriso",
      "Tô com o dente quebrado",
      "Quero deixar o sorriso branquinho"
    ]) {
      if (lowerMessage.includes(phrase.toLowerCase())) {
        // Identifica o serviço específico
        if (phrase.includes("juízo") || phrase.includes("siso")) {
          newContext.interestedInService = "extração de siso";
        } else if (phrase.includes("branquinho") || phrase.includes("branco")) {
          newContext.interestedInService = "clareamento";
        } else if (phrase.includes("quebrado")) {
          newContext.interestedInService = "restauração";
        } else if (phrase.includes("podre")) {
          newContext.interestedInService = "tratamento dental";
        } else if (phrase.includes("consertar") || phrase.includes("sorriso")) {
          newContext.interestedInService = "estética dental";
        }
        
        setChatContext(newContext);
        
        // Encontra a resposta correspondente
        if (phrase.includes("juízo") || phrase.includes("siso")) {
          return RESPONSES.siso;
        } else if (phrase.includes("branquinho") || phrase.includes("branco")) {
          return RESPONSES.clareamento;
        } else if (phrase.includes("quebrado")) {
          return "Calma, estamos aqui pra te ajudar! 🛟 Conseguimos restaurar o dente rapidinho e deixar seu sorriso novinho em folha! Quer que eu veja o melhor horário pra te encaixar hoje mesmo?";
        } else if (phrase.includes("podre")) {
          return "Fica tranquilo(a)! Nós somos especialistas em salvar sorrisos! ❤️ Dá pra restaurar ou até reconstruir o dente, dependendo do caso. Vamos agendar uma avaliação sem compromisso?";
        } else if (phrase.includes("consertar") || phrase.includes("sorriso")) {
          return "Dá SIM e vai ficar incrível! ✨ Trabalhamos com estética dental de última geração para devolver a confiança no seu sorriso. Vamos marcar um horário para ver o que combina mais com você?";
        }
      }
    }
    
    // Checa por palavras-chave de sentimento
    if (lowerMessage.includes("bem") || 
        lowerMessage.includes("feliz") || 
        lowerMessage.includes("ótimo") || 
        lowerMessage.includes("ótima")) {
      newContext.sentimentDetected = 'positive';
      setChatContext(newContext);
      return RESPONSES.positive;
    } else if (lowerMessage.includes("mal") || 
               lowerMessage.includes("triste") || 
               lowerMessage.includes("péssimo") || 
               lowerMessage.includes("péssima") || 
               lowerMessage.includes("ruim") ||
               lowerMessage.includes("cansado") ||
               lowerMessage.includes("cansada")) {
      newContext.sentimentDetected = 'negative';
      setChatContext(newContext);
      
      // Se ainda não ofereceu desconto, oferece 15%
      if (!chatContext.hasGivenDiscount) {
        newContext.hasGivenDiscount = true;
        newContext.discountAmount = 15;
        setChatContext(newContext);
      }
      
      return RESPONSES.negative;
    }
    
    // Checa por perguntas sobre diferencial da clínica - responde com variações
    if (lowerMessage.includes("por que contratar") || 
        lowerMessage.includes("por que escolher vocês") || 
        lowerMessage.includes("por que ir aí") ||
        lowerMessage.includes("motivo para escolher") ||
        lowerMessage.includes("razão para escolher")) {
      // Respostas ultra persuasivas de vendas para "por que contratar vocês"
      const salesResponses = [
        "🔥 PROMOÇÃO EXCLUSIVA PARA VOCÊ! 🔥\n\nSomos a ÚNICA clínica da região com tecnologia de ponta que ELIMINA a DOR em 100% dos procedimentos! ✅\n\nMais de 10.000 sorrisos transformados, com taxa de satisfação de 99,8%! Nossos profissionais são REFERÊNCIA nacional e utilizam técnicas exclusivas!\n\n⚠️ APROVEITE AGORA: 20% OFF em QUALQUER tratamento se agendar HOJE! Vagas LIMITADAS para esta semana!\n\nQuer garantir seu desconto exclusivo? Posso reservar um horário VIP para você! ⏰",
        
        "⭐ DIFERENTE DE QUALQUER OUTRA CLÍNICA! ⭐\n\nCansado de tratamentos que não cumprem o prometido? Aqui entregamos RESULTADOS GARANTIDOS por escrito! 📝\n\nEconomize até R$3.500 em tratamentos combinados com nossos pacotes promocionais! 💰\n\nEQUIPE PREMIADA internacionalmente usando materiais importados que outras clínicas nem conhecem ainda!\n\n⚡ BÔNUS ESPECIAL: Avaliação + Limpeza + Kit clareador por apenas R$99 para novos pacientes! VAGAS LIMITADÍSSIMAS!\n\nPosso garantir sua vaga ainda hoje?",
        
        "💎 EXPERIÊNCIA VIP QUE VOCÊ MERECE! 💎\n\nImaginando como seria ter o sorriso dos seus sonhos SEM DOR, SEM DESCONFORTO e com PARCELAS QUE CABEM NO SEU BOLSO? 💭\n\nNossa tecnologia exclusiva reduz o tempo de tratamento em até 60% comparado às clínicas convencionais! ⏱️\n\nJUNTE-SE aos mais de 15.000 pacientes satisfeitos que transformaram não só o sorriso, mas a AUTOCONFIANÇA e a QUALIDADE DE VIDA!\n\n🔥 OFERTA RELÂMPAGO: 30% OFF para os primeiros 5 agendamentos do dia! Você vai deixar essa oportunidade passar? ⏳",
        
        "🚨 ALERTA DE OPORTUNIDADE! 🚨\n\nEnquanto você PENSA, outras pessoas estão AGENDANDO e garantindo os melhores horários e DESCONTOS EXCLUSIVOS que só oferecemos hoje! ⏰\n\nSomos a clínica MAIS PREMIADA da região, com equipamentos digitais que resultam em tratamentos INDOLORES e ULTRA-RÁPIDOS! 🏆\n\nFinanciamento próprio com APROVAÇÃO IMEDIATA! Parcele em até 24X com a PRIMEIRA PARCELA SÓ PARA DAQUI 30 DIAS! 💳\n\n⭐ DECIDA AGORA: Agende sua avaliação VIP e ganhe um clareamento dental EXPRESS no mesmo dia! Posso reservar seu horário?",
        
        "💯 COMPROMISSO DE RESULTADO! 💯\n\nA diferença entre um sorriso comum e um sorriso DESLUMBRANTE está a apenas UMA DECISÃO de distância! ✨\n\nNossa equipe utiliza PROTOCOLOS EXCLUSIVOS de última geração que garantem resultados em metade do tempo e com o DOBRO da durabilidade! 🔬\n\nMais de 300 DEPOIMENTOS 5 ESTRELAS não mentem! Somos os ÚNICOS com satisfação garantida ou seu dinheiro de volta! 💰\n\n🔥 SUPER OFERTA: Feche qualquer pacote hoje e ganhe um tratamento facial de HARMONIZAÇÃO EXPRESS totalmente GRÁTIS! Posso contar como seu agendamento VIP?"
      ];
      
      return salesResponses[Math.floor(Math.random() * salesResponses.length)];
    }
    else if (lowerMessage.includes("por que") || 
        lowerMessage.includes("vantagem") || 
        lowerMessage.includes("diferencial") || 
        lowerMessage.includes("melhor")) {
      return getRandomAdvantage();
    }
    
    // Checa por palavras-chave individuais de serviços e objeções
    for (const [keyword, response] of Object.entries(KEYWORDS)) {
      if (lowerMessage.includes(keyword)) {
        // Se for uma palavra-chave de serviço, atualiza o serviço de interesse
        if (["siso", "juízo", "clareamento", "branqueamento", "canal", "limpeza", "aparelho", 
             "bruxismo", "ranger", "cárie", "implante", "extração", "botox", "preenchimento", 
             "facial", "bichectomia", "papada"].includes(keyword)) {
          newContext.interestedInService = keyword;
          setChatContext(newContext);
        }
        
        return response;
      }
    }
    
    // Se nenhuma palavra-chave específica foi encontrada
    return RESPONSES.default;
  };

  // Função para usar uma sugestão de IA como input
  const handleUseSuggestion = (suggestion: AISuggestion) => {
    if (isTyping) return;
    
    // Registra o tópico na lista de tópicos recentes
    setChatContext(prev => ({
      ...prev,
      recentTopics: [...prev.recentTopics, suggestion.type],
      lastInteraction: new Date()
    }));
    
    // Usa a sugestão como mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: suggestion.text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Reinicia o timer de inatividade
    resetInactivityTimer();
    
    // Simula o chatbot digitando
    setIsTyping(true);
    
    // Determina o tempo de digitação baseado no tamanho da resposta
    const response = generateResponse(suggestion.text);
    const typingTime = Math.min(2000, 500 + response.length * 5);
    
    // Gera a resposta após um pequeno delay
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, typingTime);
  };
  
  // Envia a mensagem e gera uma resposta inteligente
  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Adiciona a mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Detecta possíveis tópicos para adicionar ao contexto
    const lowerInput = input.toLowerCase();
    let detectedTopic = null;
    
    if (lowerInput.includes("clareamento") || lowerInput.includes("branqueamento")) {
      detectedTopic = "clareamento";
    } else if (lowerInput.includes("siso") || lowerInput.includes("juízo")) {
      detectedTopic = "extração";
    } else if (lowerInput.includes("botox") || lowerInput.includes("preenchimento")) {
      detectedTopic = "harmonização";
    } else if (lowerInput.includes("cartão") || lowerInput.includes("pix") || lowerInput.includes("pagamento")) {
      detectedTopic = "payment";
    }
    
    // Atualiza o contexto do chat
    setChatContext(prev => ({
      ...prev,
      lastInteraction: new Date(),
      recentTopics: detectedTopic ? [...prev.recentTopics, detectedTopic] : prev.recentTopics
    }));
    
    // Reinicia o timer de inatividade
    resetInactivityTimer();
    
    // Simula o chatbot digitando
    setIsTyping(true);
    
    // Determina o tempo de digitação baseado no tamanho da resposta
    const response = generateResponse(input);
    const typingTime = Math.min(2000, 500 + response.length * 5);
    
    // Gera a resposta após um pequeno delay
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, typingTime);
  };

  // Toggle para abrir/fechar o chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
      
      // Reinicia o timer de inatividade ao abrir o chat
      resetInactivityTimer();
    }
  };

  // Toggle para minimizar/maximizar o chat
  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Botão para abrir o chat */}
      {!isOpen && (
        <Button 
          onClick={toggleChat}
          size="lg"
          className="rounded-full p-4 bg-primary hover:bg-primary/90 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="ml-2">Chat</span>
        </Button>
      )}
      
      {/* Janela do chat */}
      {isOpen && (
        <Card className="w-80 md:w-96 shadow-xl transition-all duration-300">
          <CardHeader className="border-b p-3 flex flex-row justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Assistente Virtual DentalSpa
            </CardTitle>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={toggleMinimize}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <>
              <CardContent className="p-0">
                <ScrollArea className="h-[220px] p-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      } mb-3`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.sender === 'user' ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                          <span className="text-xs font-medium">
                            {message.sender === 'user' ? 'Você' : 'Assistente'}
                          </span>
                        </div>
                        
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        
                        <p className="text-xs opacity-70 mt-1 text-right">
                          {formatTimeAgo(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="h-3 w-3" />
                          <span className="text-xs font-medium">Assistente</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '400ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>
              {/* AI Suggestions */}
              <div className="p-1.5 border-t">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Sugestões de IA</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {currentSuggestions.map((suggestion) => (
                    <Badge
                      key={suggestion.id}
                      variant={
                        suggestion.type === 'appointment' ? 'default' :
                        suggestion.type === 'service' ? 'secondary' :
                        suggestion.type === 'payment' ? 'outline' :
                        suggestion.type === 'discount' ? 'destructive' : 
                        'outline'
                      }
                      className={cn(
                        "cursor-pointer transition-colors text-xs",
                        suggestion.type === 'appointment' && "bg-blue-500 hover:bg-blue-600",
                        suggestion.type === 'service' && "bg-green-500 hover:bg-green-600",
                        suggestion.type === 'payment' && "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white",
                        suggestion.type === 'discount' && "bg-pink-500 hover:bg-pink-600",
                        suggestion.type === 'general' && "border-gray-300 hover:bg-gray-100"
                      )}
                      onClick={() => handleUseSuggestion(suggestion)}
                    >
                      {suggestion.text}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <CardFooter className="border-t p-1.5">
                <div className="flex w-full items-center gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                    className="flex-1 text-sm"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        disabled={isTyping}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" side="top" align="end">
                      <div className="p-2 border-b">
                        <h3 className="text-sm font-medium">Perguntas frequentes</h3>
                      </div>
                      <div className="p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                        {FREQUENT_QUESTIONS.map((question, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            className="w-full justify-start text-sm font-normal"
                            onClick={() => {
                              setInput(question);
                              
                              // Opcional: fechar o popover ao clicar na pergunta
                              document.body.click();
                              
                              // Alternativa: enviar a mensagem automaticamente
                              // setTimeout(() => handleSendMessage(), 100);
                            }}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isTyping}
                    size="icon"
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </div>
  );
}