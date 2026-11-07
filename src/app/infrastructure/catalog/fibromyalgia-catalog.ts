import { Injectable } from '@angular/core';
import { BodyRegionId } from '../../domain/models/body-region';
import { Symptom, SymptomCategory } from '../../domain/models/symptom';
import { SymptomCatalog } from '../../domain/ports/symptom-catalog';

type Row = [id: string, name: string, description: string, regions: BodyRegionId[]];

const GROUPS: { category: SymptomCategory; rows: Row[] }[] = [
  {
    category: { id: 'head', name: 'Cabeça, olhos e pescoço' },
    rows: [
      [
        'retro-ocular-pain',
        'Dor e pressão retro-ocular',
        'Sensação de peso, aperto ou dor profunda atrás dos olhos.',
        ['head'],
      ],
      [
        'blurred-vision',
        'Visão turva ou embaçada',
        'Oscilações na nitidez e dificuldade para focalizar imagens.',
        ['head'],
      ],
      [
        'photophobia',
        'Fotofobia',
        'Sensibilidade exagerada à luz (solar, artificial ou de telas).',
        ['head'],
      ],
      ['dry-eye', 'Olho seco', 'Sensação de queimação, coceira ou "areia nos olhos".', ['head']],
      [
        'headache',
        'Dores de cabeça frequentes',
        'Enxaquecas crônicas ou cefaleias tensionais.',
        ['head'],
      ],
      [
        'scalp-pain',
        'Dor ou incômodo no couro cabeludo',
        'Sensibilidade ao pentear, amarrar o cabelo ou deitar a cabeça no travesseiro.',
        ['head'],
      ],
      [
        'smell-hearing-sensitivity',
        'Hipersensibilidade ao olfato e à audição',
        'Intolerância exagerada a perfumes, cheiros fortes e ruídos cotidianos.',
        ['head'],
      ],
      [
        'tmj',
        'Disfunção na ATM',
        'Dor, estalos e rigidez na articulação temporomandibular.',
        ['head'],
      ],
      [
        'dizziness',
        'Tonturas e vertigens',
        'Sensação de desequilíbrio e instabilidade.',
        ['head', 'whole-body'],
      ],
    ],
  },
  {
    category: { id: 'cns', name: 'Cognição, sono e humor' },
    rows: [
      [
        'fibrofog',
        'Nevoeiro mental (fibrofog)',
        'Lapsos de memória recente, dificuldade de concentração, raciocínio lento e dificuldade para encontrar palavras.',
        ['head'],
      ],
      [
        'sleep-disorder',
        'Distúrbios do sono',
        'Insônia, despertares frequentes e sono não reparador (acordar exausto).',
        ['head', 'whole-body'],
      ],
      [
        'fragmented-sleep',
        'Sono fragmentado',
        'Despertares repetidos durante a noite e dificuldade de alcançar um descanso reparador.',
        ['head', 'whole-body'],
      ],
      [
        'mood-changes',
        'Alterações emocionais',
        'Maior ocorrência de ansiedade, ataques de pânico e depressão.',
        ['head', 'whole-body'],
      ],
      [
        'thermal-dysregulation',
        'Desregulação térmica',
        'Sensação exagerada de frio ou calor e episódios de sudorese.',
        ['whole-body'],
      ],
      [
        'sensory-hypersensitivity',
        'Hipersensibilidade sensorial',
        'Intolerância a estímulos táteis, sonoros, luminosos e olfativos, como ruídos, luzes intensas, perfumes e certos toques.',
        ['head', 'whole-body'],
      ],
    ],
  },
  {
    category: { id: 'torso', name: 'Tronco: peito, dorso e quadris' },
    rows: [
      [
        'tender-points',
        'Pontos de sensibilidade (tender points)',
        'Dor à palpação na base do crânio, pescoço, ombros, caixa torácica, lombar e quadris.',
        ['torso', 'head', 'whole-body'],
      ],
      [
        'morning-stiffness',
        'Rigidez matinal',
        'Sensação de corpo travado ou pesado logo ao levantar da cama.',
        ['torso', 'whole-body'],
      ],
      [
        'muscle-stiffness',
        'Sensação de rigidez muscular',
        'Dificuldade de movimentar regiões do corpo após repouso, com musculatura endurecida, contraída ou pesada.',
        ['torso', 'arms', 'legs', 'whole-body'],
      ],
      [
        'pressure-sensitivity',
        'Sensibilidade à pressão',
        'Dor exagerada ao ficar sentado, deitado ou apoiado, mesmo com pressão leve ou moderada.',
        ['torso', 'legs', 'whole-body'],
      ],
      [
        'costochondritis',
        'Costocondrite',
        'Dor e sensibilidade nas cartilagens das costelas (parede torácica).',
        ['torso'],
      ],
    ],
  },
  {
    category: { id: 'limbs', name: 'Braços e pernas' },
    rows: [
      [
        'migrating-pain',
        'Dor difusa e móvel ("dor que anda")',
        'Dor profunda, queimação ou pontadas que mudam constantemente de lugar pelo corpo.',
        ['arms', 'legs', 'torso', 'whole-body'],
      ],
      [
        'paresthesia',
        'Parestesias e disestesias',
        'Formigamento, dormência, choques ou fisgadas repentinas nas mãos e nos pés.',
        ['arms', 'legs'],
      ],
      [
        'cramps',
        'Cãibras e espasmos',
        'Contrações dolorosas espontâneas, tremores leves ou pequenos tiques musculares.',
        ['arms', 'legs'],
      ],
      [
        'restless-legs',
        'Síndrome das pernas inquietas',
        'Desejo incontrolável de mover as pernas, especialmente ao deitar.',
        ['legs'],
      ],
      [
        'subjective-swelling',
        'Inchaço subjetivo',
        'Sensação de mãos e pés inchados, mesmo sem edema visível.',
        ['arms', 'legs'],
      ],
      [
        'subjective-weakness',
        'Fraqueza subjetiva',
        'Sensação de falta de força nos braços, pernas ou no corpo todo, sem perda muscular nos exames.',
        ['arms', 'legs', 'whole-body'],
      ],
    ],
  },
  {
    category: { id: 'energy', name: 'Fadiga e tolerância ao esforço' },
    rows: [
      [
        'persistent-fatigue',
        'Fadiga persistente',
        'Cansaço físico e mental intenso, desproporcional às atividades realizadas.',
        ['whole-body'],
      ],
      [
        'effort-intolerance',
        'Intolerância ao esforço',
        'Piora da dor, fadiga e exaustão após atividades físicas ou mentais, mesmo leves.',
        ['whole-body'],
      ],
      [
        'post-activity-pain',
        'Dor após atividades cotidianas',
        'Dor desproporcional após tarefas simples: limpar a casa, caminhar, subir escadas, carregar objetos.',
        ['whole-body', 'arms', 'legs'],
      ],
    ],
  },
  {
    category: { id: 'autonomic', name: 'Coração e funções autônomas' },
    rows: [
      [
        'orthostatic-hypotension',
        'Hipotensão ortostática',
        'Tontura, cabeça leve ou escurecimento da visão ao se levantar rapidamente.',
        ['head', 'whole-body'],
      ],
      [
        'palpitations',
        'Palpitações cardíacas',
        'Batimentos acelerados ou descompassados no peito, mesmo em repouso.',
        ['torso'],
      ],
      [
        'abnormal-sweating',
        'Sudorese anormal',
        'Crises de suor excessivo sem relação com calor ou esforço.',
        ['whole-body'],
      ],
      [
        'poor-coordination',
        'Falta de coordenação motora',
        'Instabilidade ao andar, esbarrar em objetos ou deixar coisas caírem das mãos.',
        ['whole-body', 'arms', 'legs'],
      ],
    ],
  },
  {
    category: { id: 'gi-urinary', name: 'Digestão e sistema urinário' },
    rows: [
      [
        'ibs',
        'Síndrome do intestino irritável',
        'Cólicas abdominais, gases e alternância entre diarreia e prisão de ventre.',
        ['abdomen'],
      ],
      [
        'nausea-heartburn',
        'Náuseas e queimação',
        'Azia, náuseas ou desconforto estomacal frequente.',
        ['abdomen', 'torso'],
      ],
      [
        'interstitial-cystitis',
        'Cistite intersticial',
        'Dor ou queimação na bexiga sem infecção urinária.',
        ['abdomen'],
      ],
      [
        'urinary-urgency',
        'Urgência urinária',
        'Necessidade frequente e repentina de urinar.',
        ['abdomen'],
      ],
      [
        'pelvic-pain',
        'Dores pélvicas',
        'Cólicas menstruais intensas ou dor durante a relação sexual.',
        ['abdomen'],
      ],
    ],
  },
  {
    category: { id: 'skin', name: 'Pele e sensibilidades gerais' },
    rows: [
      [
        'allodynia',
        'Alodinia',
        'Dor causada por estímulos leves, como o toque de uma roupa, um abraço ou uma superfície.',
        ['whole-body', 'arms', 'legs', 'torso'],
      ],
      [
        'formication',
        'Formicação',
        'Sensação de insetos andando ou rastejando sobre a pele.',
        ['whole-body', 'arms', 'legs'],
      ],
      [
        'itching-dryness',
        'Prurido e secura',
        'Coceira na pele sem lesões aparentes e ressecamento das mucosas.',
        ['whole-body'],
      ],
      [
        'weather-sensitivity',
        'Intolerância a mudanças climáticas',
        'Piora das dores com frentes frias, quedas de temperatura ou variação de pressão.',
        ['whole-body'],
      ],
      [
        'medication-sensitivity',
        'Sensibilidade a medicamentos',
        'Reações colaterais ou dificuldade de tolerar medicamentos em doses habituais.',
        ['whole-body'],
      ],
    ],
  },
];

@Injectable()
export class FibromyalgiaCatalog extends SymptomCatalog {
  private readonly allCategories = GROUPS.map((g) => g.category);
  private readonly allSymptoms: Symptom[] = GROUPS.flatMap(({ category, rows }) =>
    rows.map(([id, name, description, regionIds]) => ({
      id,
      name,
      description,
      regionIds,
      categoryId: category.id,
      custom: false,
    })),
  );

  categories(): readonly SymptomCategory[] {
    return this.allCategories;
  }

  symptoms(): readonly Symptom[] {
    return this.allSymptoms;
  }
}
