import { EmployeePrenomina, HeaderPrenomina } from '../types/payroll';

export const DEFAULT_HEADER_PRENOMINA: HeaderPrenomina = {
  confecciona: 'DAYSI REYES DÍAZ',
  chequea: 'PEDRO ALBERTO GALBÁN LOPEZ',
  aprueba: 'ZUNILDA MENDEZ LINARES',
  anota: 'ELIESER DUARTES LÓPEZ',
  periodoCorresponde: '8',
  numeroConsecutivo: '6 de 7',
  fechaDesde: '1 agosto 2026',
  fechaHasta: '31 agosto 2026',
  codigoREEUP: '151.0.4897',
  direccionCC: 'CC 101',
  fechaConclusion: '01/08/2026'
};

// Generador de plantilla de 31 días con patrón estándar 9-9-9-9-8 (o vacíos en descansos)
export const createDefaultDaysPattern185 = (): string[] => {
  return [
    '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
    '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
  ];
};

/**
 * Jornada de 200 horas con turnos rotativos de 12.5 horas:
 * 2 de trabajo (12.5h) y 2 de descanso ('D')
 * 16 días trabajados × 12.5h = 200 horas laboradas
 */
export const createDaysPattern200h = (): string[] => {
  return [
    '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D',
    'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D'
  ];
};

export const INITIAL_OFFICIAL_EMPLOYEES: EmployeePrenomina[] = [
  {
    id: 'emp-01',
    nombreApellidos: 'Maikel González Portela',
    cargo: 'Técnico de Nivel Medio',
    catOcupacional: 'T',
    centroCostoId: 'cc-101',
    fondoTiempoIndividual: 185,
    // Días 1 a 15: trabajó 88h (9, 9, 9, 9, 8...), Días 16 a 31: Vacaciones "V" (97h)
    dias: [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', '', '', '', '', ''
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 0,
      horas10: 0,
      totalNocturnidad: 0
    },
    trabajoExtra: {
      horas: 0,
      importe: 0
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 97,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 4800,
    tarifaHoraria: 25.18, // 4800 / 190.6
    notas: 'Vacaciones planificadas desde el día 16 (97 horas C-25).'
  },
  {
    id: 'emp-02',
    nombreApellidos: 'Ángel Tomás Gutiérrez Arucas',
    cargo: 'Especialista Principal',
    catOcupacional: 'T',
    centroCostoId: 'cc-101',
    fondoTiempoIndividual: 200,
    // Turno rotativo de 200h (12.5h, 12.5h, D, D)
    dias: [
      '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D',
      'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D'
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 15,
      horas10: 0,
      totalNocturnidad: 93.75
    },
    trabajoExtra: {
      horas: 73,
      importe: 4294.88
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 5200,
    tarifaHoraria: 27.28, // 5200 / 190.6
    notas: 'Jornada 200h (turnos rotativos 12.5h y D de descanso). 15h nocturnidad y 73h extra C-74.'
  },
  {
    id: 'emp-03',
    nombreApellidos: 'Rafael Alfredo Delgado Lorenzo',
    cargo: 'Técnico de Nivel Medio',
    catOcupacional: 'T',
    centroCostoId: 'cc-101',
    fondoTiempoIndividual: 185,
    dias: [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 0,
      horas10: 0,
      totalNocturnidad: 0
    },
    trabajoExtra: {
      horas: 0,
      importe: 0
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 4800,
    tarifaHoraria: 25.18, // 4800 / 190.6
    notas: 'Cumplimiento íntegro de jornada 185h.'
  },
  {
    id: 'emp-04',
    nombreApellidos: 'Eglisneydis Galano Orduñez',
    cargo: 'Técnico de Nivel Medio',
    catOcupacional: 'T',
    centroCostoId: 'cc-101',
    fondoTiempoIndividual: 185,
    dias: [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 0,
      horas10: 0,
      totalNocturnidad: 0
    },
    trabajoExtra: {
      horas: 0,
      importe: 0
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 4800,
    tarifaHoraria: 25.18,
    notas: 'Cumplimiento íntegro de jornada 185h.'
  },
  {
    id: 'emp-05',
    nombreApellidos: 'Arturo Hermes Patiño Rojas',
    cargo: 'Técnico de Nivel Medio',
    catOcupacional: 'T',
    centroCostoId: 'cc-101',
    fondoTiempoIndividual: 185,
    dias: [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 0,
      horas10: 0,
      totalNocturnidad: 0
    },
    trabajoExtra: {
      horas: 0,
      importe: 0
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 4800,
    tarifaHoraria: 25.18,
    notas: 'Cumplimiento íntegro de jornada 185h.'
  },
  {
    id: 'emp-06',
    nombreApellidos: 'Raimundo Martinto Puig',
    cargo: 'Cuadro de Dirección',
    catOcupacional: 'C',
    centroCostoId: 'cc-101',
    fondoTiempoIndividual: 185,
    dias: [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 4,
      horas10: 0,
      totalNocturnidad: 25.00
    },
    trabajoExtra: {
      horas: 67.5,
      importe: 5976.19
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 6500,
    tarifaHoraria: 34.10, // 6500 / 190.6
    notas: 'Cuadro de dirección. 67.5h trabajo extraordinario C-74.'
  },
  {
    id: 'emp-07',
    nombreApellidos: 'Isael Pacheco Rivero',
    cargo: 'Técnico de Nivel Medio',
    catOcupacional: 'T',
    centroCostoId: 'cc-101',
    fondoTiempoIndividual: 185,
    dias: [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 0,
      horas10: 0,
      totalNocturnidad: 0
    },
    trabajoExtra: {
      horas: 0,
      importe: 0
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 4800,
    tarifaHoraria: 25.18,
    notas: 'Cumplimiento íntegro de jornada 185h.'
  },
  {
    id: 'emp-08',
    nombreApellidos: 'Miguel Ramón Gálvez Martínez',
    cargo: 'Operario de Mantenimiento',
    catOcupacional: 'O',
    centroCostoId: 'cc-101',
    fondoTiempoIndividual: 185,
    dias: [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 0,
      horas10: 0,
      totalNocturnidad: 0
    },
    trabajoExtra: {
      horas: 0,
      importe: 0
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 4200,
    tarifaHoraria: 22.04, // 4200 / 190.6
    notas: 'Operario de mantenimiento.'
  },
  // Trabajadores de otros CC para demostrar Cierre Final multi-CC
  {
    id: 'emp-09',
    nombreApellidos: 'Osmany Betancourt Valera',
    cargo: 'Operario Calificado',
    catOcupacional: 'O',
    centroCostoId: 'cc-102',
    fondoTiempoIndividual: 200,
    dias: [
      '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D',
      'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D'
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 20,
      horas10: 0,
      totalNocturnidad: 100.00
    },
    trabajoExtra: {
      horas: 16,
      importe: 638.00
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 3800,
    tarifaHoraria: 19.94, // 3800 / 190.6
    notas: 'Operaciones CC 102. Turno rotativo 200h.'
  },
  {
    id: 'emp-10',
    nombreApellidos: 'Héctor Luis Cárdenas Marrero',
    cargo: 'Operario de Mantenimiento',
    catOcupacional: 'O',
    centroCostoId: 'cc-103',
    fondoTiempoIndividual: 185,
    dias: [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
    ],
    nocturnidad: {
      nochesComp100: 0,
      horas5: 0,
      horas10: 0,
      totalNocturnidad: 0
    },
    trabajoExtra: {
      horas: 12,
      importe: 528.96
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 4200,
    tarifaHoraria: 22.04,
    notas: 'Mantenimiento CC 103.'
  }
];
