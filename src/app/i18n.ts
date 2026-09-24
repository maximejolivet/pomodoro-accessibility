import { Injectable, computed, signal } from '@angular/core';
import { readPref, writePref } from './storage';

const fr = {
  'state.running': 'En cours',
  'state.paused': 'En pause',
  'state.finished': 'Terminé',
  'state.ready': 'Prêt',
  'state.extra': 'Prolongation',
  'mode.custom': 'Personnalisé',
  'mode.extra': '+5 min',
  'cycle': 'Cycle {n}/{total}',

  'action.start': 'Démarrer',
  'action.pause': 'Pause',
  'action.resume': 'Reprendre',
  'action.reset': 'Remettre à zéro',
  'action.settings': 'Réglages',
  'action.close': 'Fermer',
  'action.dialHint': 'glisser sur le cadran pour régler les minutes',
  'action.accessibilityInfo': 'Voir la documentation d\'accessibilité RGAA 4.1',
  'action.accessibilityShort': 'Accessibilité RGAA',

  'unit.minutes': 'minutes',

  'color.purple': 'Violet',
  'color.red': 'Rouge',
  'color.orange': 'Orange',
  'color.amber': 'Ambre',
  'color.lime': 'Vert citron',
  'color.green': 'Vert',
  'color.cyan': 'Cyan',
  'color.blue': 'Bleu',
  'color.magenta': 'Magenta',
  'color.gray': 'Gris',

  'tab.modes': 'Modes',
  'tab.stats': 'Stats',
  'tab.settings': 'Réglages',

  'settings.dark': 'Mode sombre',
  'settings.sound': 'Son',
  'settings.autoExtra': '+5 min auto à la fin',
  'settings.autoChain': 'Enchaîner travail → pause',
  'settings.autoChainHint': 'Pause longue tous les {n} cycles',
  'settings.keepAwake': 'Écran toujours allumé',
  'settings.language': 'Langue',
  'settings.languageAuto': 'Auto',
  'settings.listen': 'Écouter les sons',
  'settings.listenOne': 'Écouter le son {label}',
  'settings.rgaaDocumentation': 'Documentation RGAA 4.1',
  'settings.duration': 'Durée',
  'settings.goal': 'Objectif quotidien',

  'preset.pomodoro': 'Pomodoro',
  'preset.break': 'Pause',
  'preset.longBreak': 'Pause longue',
  'preset.focus': 'Focus TDAH',
  'preset.new': 'Nouveau mode',
  'preset.edit': 'Modifier {name}',
  'preset.name': 'Nom',
  'preset.kind': 'Type',
  'preset.kind.focus': 'Travail',
  'preset.kind.break': 'Pause',
  'preset.kind.longBreak': 'Pause longue',
  'preset.color': 'Couleur',
  'preset.save': 'Enregistrer',
  'preset.cancel': 'Annuler',
  'preset.delete': 'Supprimer',
  'preset.restore': 'Rétablir les modes par défaut',
  'preset.confirm': 'Toucher encore pour confirmer',

  'stats.focus': "Focus aujourd'hui",
  'stats.sessions': 'Sessions',
  'stats.streak': 'Série',
  'stats.streakValue': '{n} j',
  'stats.week': '7 derniers jours',
  'stats.weekDay': 'Jour',
  'stats.weekMinutes': 'Minutes de focus',
  'stats.weekLabel': '{day} : {m} min de focus',
  'stats.recent': 'Dernières sessions',
  'stats.empty': "Aucune session pour l'instant. Lance un minuteur !",
  'stats.completed': 'Terminée',
  'stats.interrupted': 'Interrompue',
  'stats.clear': "Effacer l'historique",
  'stats.goal': 'Objectif du jour',
  'stats.goalReached': 'Objectif atteint !',

  'notif.milestoneTitle': 'Plus que {m} minutes',
  'notif.milestoneBody': 'Le temps avance, garde le cap.',
  'notif.endTitle': 'Temps écoulé',
  'notif.endBodyExtra': '+{m} min pour terminer.',
  'notif.endBody': 'Fais une pause.',
  'notif.extraEndTitle': 'Prolongation terminée',
  'notif.nextBody': 'Place à : {name}',
  'notif.channel.milestone': 'Palier {m} min',
  'notif.channel.end': 'Fin du minuteur'
};

export type I18nKey = keyof typeof fr;
type Dictionary = Record<I18nKey, string>;

const en: Dictionary = {
  'state.running': 'Running',
  'state.paused': 'Paused',
  'state.finished': 'Done',
  'state.ready': 'Ready',
  'state.extra': 'Extra time',
  'mode.custom': 'Custom',
  'mode.extra': '+5 min',
  'cycle': 'Round {n}/{total}',

  'action.start': 'Start',
  'action.pause': 'Pause',
  'action.resume': 'Resume',
  'action.reset': 'Reset',
  'action.settings': 'Settings',
  'action.close': 'Close',
  'action.dialHint': 'drag on the dial to set the minutes',
  'action.accessibilityInfo': 'View RGAA 4.1 accessibility documentation',
  'action.accessibilityShort': 'RGAA accessibility',

  'unit.minutes': 'minutes',

  'color.purple': 'Purple',
  'color.red': 'Red',
  'color.orange': 'Orange',
  'color.amber': 'Amber',
  'color.lime': 'Lime green',
  'color.green': 'Green',
  'color.cyan': 'Cyan',
  'color.blue': 'Blue',
  'color.magenta': 'Magenta',
  'color.gray': 'Gray',

  'tab.modes': 'Modes',
  'tab.stats': 'Stats',
  'tab.settings': 'Settings',

  'settings.dark': 'Dark mode',
  'settings.sound': 'Sound',
  'settings.autoExtra': 'Auto +5 min at the end',
  'settings.autoChain': 'Chain work → break',
  'settings.autoChainHint': 'Long break every {n} rounds',
  'settings.keepAwake': 'Keep screen on',
  'settings.language': 'Language',
  'settings.languageAuto': 'Auto',
  'settings.listen': 'Preview sounds',
  'settings.listenOne': 'Play the {label} sound',
  'settings.rgaaDocumentation': 'RGAA 4.1 Documentation',
  'settings.duration': 'Duration',
  'settings.goal': 'Daily goal',

  'preset.pomodoro': 'Pomodoro',
  'preset.break': 'Break',
  'preset.longBreak': 'Long break',
  'preset.focus': 'ADHD focus',
  'preset.new': 'New mode',
  'preset.edit': 'Edit {name}',
  'preset.name': 'Name',
  'preset.kind': 'Type',
  'preset.kind.focus': 'Work',
  'preset.kind.break': 'Break',
  'preset.kind.longBreak': 'Long break',
  'preset.color': 'Color',
  'preset.save': 'Save',
  'preset.cancel': 'Cancel',
  'preset.delete': 'Delete',
  'preset.restore': 'Restore default modes',
  'preset.confirm': 'Tap again to confirm',

  'stats.focus': 'Focus today',
  'stats.sessions': 'Sessions',
  'stats.streak': 'Streak',
  'stats.streakValue': '{n} d',
  'stats.week': 'Last 7 days',
  'stats.weekDay': 'Day',
  'stats.weekMinutes': 'Focus minutes',
  'stats.weekLabel': '{day}: {m} min of focus',
  'stats.recent': 'Recent sessions',
  'stats.empty': 'No sessions yet. Start a timer!',
  'stats.completed': 'Completed',
  'stats.interrupted': 'Interrupted',
  'stats.clear': 'Clear history',
  'stats.goal': "Today's goal",
  'stats.goalReached': 'Goal reached!',

  'notif.milestoneTitle': '{m} minutes left',
  'notif.milestoneBody': 'Time is moving, keep going.',
  'notif.endTitle': "Time's up",
  'notif.endBodyExtra': '+{m} min to wrap up.',
  'notif.endBody': 'Take a break.',
  'notif.extraEndTitle': 'Extra time is over',
  'notif.nextBody': 'Up next: {name}',
  'notif.channel.milestone': '{m} min milestone',
  'notif.channel.end': 'Timer end'
};

const es: Dictionary = {
  'state.running': 'En curso',
  'state.paused': 'En pausa',
  'state.finished': 'Terminado',
  'state.ready': 'Listo',
  'state.extra': 'Tiempo extra',
  'mode.custom': 'Personalizado',
  'mode.extra': '+5 min',
  'cycle': 'Ciclo {n}/{total}',

  'action.start': 'Iniciar',
  'action.pause': 'Pausar',
  'action.resume': 'Reanudar',
  'action.reset': 'Reiniciar',
  'action.settings': 'Ajustes',
  'action.close': 'Cerrar',
  'action.dialHint': 'desliza sobre el dial para ajustar los minutos',
  'action.accessibilityInfo': 'Ver documentación de accesibilidad RGAA 4.1',
  'action.accessibilityShort': 'Accesibilidad RGAA',

  'unit.minutes': 'minutos',

  'color.purple': 'Púrpura',
  'color.red': 'Rojo',
  'color.orange': 'Naranja',
  'color.amber': 'Ámbar',
  'color.lime': 'Verde lima',
  'color.green': 'Verde',
  'color.cyan': 'Cian',
  'color.blue': 'Azul',
  'color.magenta': 'Magenta',
  'color.gray': 'Gris',

  'tab.modes': 'Modos',
  'tab.stats': 'Estadísticas',
  'tab.settings': 'Ajustes',

  'settings.dark': 'Modo oscuro',
  'settings.sound': 'Sonido',
  'settings.autoExtra': '+5 min automático al final',
  'settings.autoChain': 'Encadenar trabajo → pausa',
  'settings.autoChainHint': 'Pausa larga cada {n} ciclos',
  'settings.keepAwake': 'Pantalla siempre encendida',
  'settings.language': 'Idioma',
  'settings.languageAuto': 'Auto',
  'settings.listen': 'Escuchar los sonidos',
  'settings.listenOne': 'Reproducir el sonido {label}',
  'settings.rgaaDocumentation': 'Documentación RGAA 4.1',
  'settings.duration': 'Duración',
  'settings.goal': 'Objetivo diario',

  'preset.pomodoro': 'Pomodoro',
  'preset.break': 'Pausa',
  'preset.longBreak': 'Pausa larga',
  'preset.focus': 'Foco TDAH',
  'preset.new': 'Nuevo modo',
  'preset.edit': 'Editar {name}',
  'preset.name': 'Nombre',
  'preset.kind': 'Tipo',
  'preset.kind.focus': 'Trabajo',
  'preset.kind.break': 'Pausa',
  'preset.kind.longBreak': 'Pausa larga',
  'preset.color': 'Color',
  'preset.save': 'Guardar',
  'preset.cancel': 'Cancelar',
  'preset.delete': 'Eliminar',
  'preset.restore': 'Restablecer los modos predeterminados',
  'preset.confirm': 'Toca otra vez para confirmar',

  'stats.focus': 'Foco hoy',
  'stats.sessions': 'Sesiones',
  'stats.streak': 'Racha',
  'stats.streakValue': '{n} d',
  'stats.week': 'Últimos 7 días',
  'stats.weekDay': 'Día',
  'stats.weekMinutes': 'Minutos de focus',
  'stats.weekLabel': '{day}: {m} min de foco',
  'stats.recent': 'Últimas sesiones',
  'stats.empty': 'Aún no hay sesiones. ¡Inicia un temporizador!',
  'stats.completed': 'Completada',
  'stats.interrupted': 'Interrumpida',
  'stats.clear': 'Borrar el historial',
  'stats.goal': 'Objetivo de hoy',
  'stats.goalReached': '¡Objetivo cumplido!',

  'notif.milestoneTitle': 'Quedan {m} minutos',
  'notif.milestoneBody': 'El tiempo avanza, sigue así.',
  'notif.endTitle': 'Se acabó el tiempo',
  'notif.endBodyExtra': '+{m} min para terminar.',
  'notif.endBody': 'Tómate un descanso.',
  'notif.extraEndTitle': 'Tiempo extra terminado',
  'notif.nextBody': 'A continuación: {name}',
  'notif.channel.milestone': 'Aviso de {m} min',
  'notif.channel.end': 'Fin del temporizador'
};

const de: Dictionary = {
  'state.running': 'Läuft',
  'state.paused': 'Pausiert',
  'state.finished': 'Fertig',
  'state.ready': 'Bereit',
  'state.extra': 'Verlängerung',
  'mode.custom': 'Eigene',
  'mode.extra': '+5 min',
  'cycle': 'Runde {n}/{total}',

  'action.start': 'Starten',
  'action.pause': 'Pausieren',
  'action.resume': 'Fortsetzen',
  'action.reset': 'Zurücksetzen',
  'action.settings': 'Einstellungen',
  'action.close': 'Schließen',
  'action.dialHint': 'auf dem Zifferblatt ziehen, um die Minuten einzustellen',
  'action.accessibilityInfo': 'RGAA 4.1-Barrierefreiheitsdokumentation ansehen',
  'action.accessibilityShort': 'Barrierefreiheit RGAA',

  'unit.minutes': 'Minuten',

  'color.purple': 'Violett',
  'color.red': 'Rot',
  'color.orange': 'Orange',
  'color.amber': 'Bernstein',
  'color.lime': 'Hellgrün',
  'color.green': 'Grün',
  'color.cyan': 'Cyan',
  'color.blue': 'Blau',
  'color.magenta': 'Magenta',
  'color.gray': 'Grau',

  'tab.modes': 'Modi',
  'tab.stats': 'Statistik',
  'tab.settings': 'Einstellungen',

  'settings.dark': 'Dunkelmodus',
  'settings.sound': 'Ton',
  'settings.autoExtra': 'Automatisch +5 min am Ende',
  'settings.autoChain': 'Arbeit → Pause verketten',
  'settings.autoChainHint': 'Lange Pause alle {n} Runden',
  'settings.keepAwake': 'Bildschirm anlassen',
  'settings.language': 'Sprache',
  'settings.languageAuto': 'Auto',
  'settings.listen': 'Töne anhören',
  'settings.listenOne': 'Ton {label} abspielen',
  'settings.rgaaDocumentation': 'RGAA 4.1-Dokumentation',
  'settings.duration': 'Dauer',
  'settings.goal': 'Tagesziel',

  'preset.pomodoro': 'Pomodoro',
  'preset.break': 'Pause',
  'preset.longBreak': 'Lange Pause',
  'preset.focus': 'ADHS-Fokus',
  'preset.new': 'Neuer Modus',
  'preset.edit': '{name} bearbeiten',
  'preset.name': 'Name',
  'preset.kind': 'Typ',
  'preset.kind.focus': 'Arbeit',
  'preset.kind.break': 'Pause',
  'preset.kind.longBreak': 'Lange Pause',
  'preset.color': 'Farbe',
  'preset.save': 'Speichern',
  'preset.cancel': 'Abbrechen',
  'preset.delete': 'Löschen',
  'preset.restore': 'Standardmodi wiederherstellen',
  'preset.confirm': 'Zum Bestätigen erneut tippen',

  'stats.focus': 'Fokus heute',
  'stats.sessions': 'Sitzungen',
  'stats.streak': 'Serie',
  'stats.streakValue': '{n} T',
  'stats.week': 'Letzte 7 Tage',
  'stats.weekDay': 'Tag',
  'stats.weekMinutes': 'Fokus-Minuten',
  'stats.weekLabel': '{day}: {m} min Fokus',
  'stats.recent': 'Letzte Sitzungen',
  'stats.empty': 'Noch keine Sitzungen. Starte einen Timer!',
  'stats.completed': 'Abgeschlossen',
  'stats.interrupted': 'Abgebrochen',
  'stats.clear': 'Verlauf löschen',
  'stats.goal': 'Heutiges Ziel',
  'stats.goalReached': 'Ziel erreicht!',

  'notif.milestoneTitle': 'Noch {m} Minuten',
  'notif.milestoneBody': 'Die Zeit läuft, bleib dran.',
  'notif.endTitle': 'Die Zeit ist um',
  'notif.endBodyExtra': '+{m} min zum Abschließen.',
  'notif.endBody': 'Mach eine Pause.',
  'notif.extraEndTitle': 'Verlängerung vorbei',
  'notif.nextBody': 'Als Nächstes: {name}',
  'notif.channel.milestone': '{m}-Minuten-Marke',
  'notif.channel.end': 'Timer-Ende'
};

const it: Dictionary = {
  'state.running': 'In corso',
  'state.paused': 'In pausa',
  'state.finished': 'Finito',
  'state.ready': 'Pronto',
  'state.extra': 'Tempo extra',
  'mode.custom': 'Personalizzato',
  'mode.extra': '+5 min',
  'cycle': 'Ciclo {n}/{total}',

  'action.start': 'Avvia',
  'action.pause': 'Pausa',
  'action.resume': 'Riprendi',
  'action.reset': 'Azzera',
  'action.settings': 'Impostazioni',
  'action.close': 'Chiudi',
  'action.dialHint': 'trascina sul quadrante per regolare i minuti',
  'action.accessibilityInfo': 'Visualizza documentazione accessibilità RGAA 4.1',
  'action.accessibilityShort': 'Accessibilità RGAA',

  'unit.minutes': 'minuti',

  'color.purple': 'Viola',
  'color.red': 'Rosso',
  'color.orange': 'Arancione',
  'color.amber': 'Ambra',
  'color.lime': 'Verde lime',
  'color.green': 'Verde',
  'color.cyan': 'Ciano',
  'color.blue': 'Blu',
  'color.magenta': 'Magenta',
  'color.gray': 'Grigio',

  'tab.modes': 'Modalità',
  'tab.stats': 'Statistiche',
  'tab.settings': 'Impostazioni',

  'settings.dark': 'Modalità scura',
  'settings.sound': 'Suono',
  'settings.autoExtra': '+5 min automatici alla fine',
  'settings.autoChain': 'Concatena lavoro → pausa',
  'settings.autoChainHint': 'Pausa lunga ogni {n} cicli',
  'settings.keepAwake': 'Schermo sempre acceso',
  'settings.language': 'Lingua',
  'settings.languageAuto': 'Auto',
  'settings.listen': 'Ascolta i suoni',
  'settings.listenOne': 'Riproduci il suono {label}',
  'settings.rgaaDocumentation': 'Documentazione RGAA 4.1',
  'settings.duration': 'Durata',
  'settings.goal': 'Obiettivo giornaliero',

  'preset.pomodoro': 'Pomodoro',
  'preset.break': 'Pausa',
  'preset.longBreak': 'Pausa lunga',
  'preset.focus': 'Focus ADHD',
  'preset.new': 'Nuova modalità',
  'preset.edit': 'Modifica {name}',
  'preset.name': 'Nome',
  'preset.kind': 'Tipo',
  'preset.kind.focus': 'Lavoro',
  'preset.kind.break': 'Pausa',
  'preset.kind.longBreak': 'Pausa lunga',
  'preset.color': 'Colore',
  'preset.save': 'Salva',
  'preset.cancel': 'Annulla',
  'preset.delete': 'Elimina',
  'preset.restore': 'Ripristina le modalità predefinite',
  'preset.confirm': 'Tocca di nuovo per confermare',

  'stats.focus': 'Focus oggi',
  'stats.sessions': 'Sessioni',
  'stats.streak': 'Serie',
  'stats.streakValue': '{n} g',
  'stats.week': 'Ultimi 7 giorni',
  'stats.weekDay': 'Giorno',
  'stats.weekMinutes': 'Minuti di focus',
  'stats.weekLabel': '{day}: {m} min di focus',
  'stats.recent': 'Ultime sessioni',
  'stats.empty': 'Ancora nessuna sessione. Avvia un timer!',
  'stats.completed': 'Completata',
  'stats.interrupted': 'Interrotta',
  'stats.clear': 'Cancella la cronologia',
  'stats.goal': 'Obiettivo di oggi',
  'stats.goalReached': 'Obiettivo raggiunto!',

  'notif.milestoneTitle': 'Ancora {m} minuti',
  'notif.milestoneBody': 'Il tempo scorre, tieni duro.',
  'notif.endTitle': 'Tempo scaduto',
  'notif.endBodyExtra': '+{m} min per finire.',
  'notif.endBody': 'Fai una pausa.',
  'notif.extraEndTitle': 'Tempo extra finito',
  'notif.nextBody': 'Prossimo: {name}',
  'notif.channel.milestone': 'Traguardo {m} min',
  'notif.channel.end': 'Fine del timer'
};

const pt: Dictionary = {
  'state.running': 'Em andamento',
  'state.paused': 'Em pausa',
  'state.finished': 'Concluído',
  'state.ready': 'Pronto',
  'state.extra': 'Tempo extra',
  'mode.custom': 'Personalizado',
  'mode.extra': '+5 min',
  'cycle': 'Ciclo {n}/{total}',

  'action.start': 'Iniciar',
  'action.pause': 'Pausar',
  'action.resume': 'Retomar',
  'action.reset': 'Reiniciar',
  'action.settings': 'Configurações',
  'action.close': 'Fechar',
  'action.dialHint': 'arraste no mostrador para ajustar os minutos',
  'action.accessibilityInfo': 'Ver documentação de acessibilidade RGAA 4.1',
  'action.accessibilityShort': 'Acessibilidade RGAA',

  'unit.minutes': 'minutos',

  'color.purple': 'Roxo',
  'color.red': 'Vermelho',
  'color.orange': 'Laranja',
  'color.amber': 'Âmbar',
  'color.lime': 'Verde lima',
  'color.green': 'Verde',
  'color.cyan': 'Ciano',
  'color.blue': 'Azul',
  'color.magenta': 'Magenta',
  'color.gray': 'Cinza',

  'tab.modes': 'Modos',
  'tab.stats': 'Estatísticas',
  'tab.settings': 'Configurações',

  'settings.dark': 'Modo escuro',
  'settings.sound': 'Som',
  'settings.autoExtra': '+5 min automático no final',
  'settings.autoChain': 'Encadear trabalho → pausa',
  'settings.autoChainHint': 'Pausa longa a cada {n} ciclos',
  'settings.keepAwake': 'Tela sempre ligada',
  'settings.language': 'Idioma',
  'settings.languageAuto': 'Auto',
  'settings.listen': 'Ouvir os sons',
  'settings.listenOne': 'Tocar o som {label}',
  'settings.rgaaDocumentation': 'Documentação RGAA 4.1',
  'settings.duration': 'Duração',
  'settings.goal': 'Meta diária',

  'preset.pomodoro': 'Pomodoro',
  'preset.break': 'Pausa',
  'preset.longBreak': 'Pausa longa',
  'preset.focus': 'Foco TDAH',
  'preset.new': 'Novo modo',
  'preset.edit': 'Editar {name}',
  'preset.name': 'Nome',
  'preset.kind': 'Tipo',
  'preset.kind.focus': 'Trabalho',
  'preset.kind.break': 'Pausa',
  'preset.kind.longBreak': 'Pausa longa',
  'preset.color': 'Cor',
  'preset.save': 'Salvar',
  'preset.cancel': 'Cancelar',
  'preset.delete': 'Excluir',
  'preset.restore': 'Restaurar os modos padrão',
  'preset.confirm': 'Toque de novo para confirmar',

  'stats.focus': 'Foco hoje',
  'stats.sessions': 'Sessões',
  'stats.streak': 'Sequência',
  'stats.streakValue': '{n} d',
  'stats.week': 'Últimos 7 dias',
  'stats.weekDay': 'Dia',
  'stats.weekMinutes': 'Minutos de foco',
  'stats.weekLabel': '{day}: {m} min de foco',
  'stats.recent': 'Últimas sessões',
  'stats.empty': 'Nenhuma sessão ainda. Inicie um timer!',
  'stats.completed': 'Concluída',
  'stats.interrupted': 'Interrompida',
  'stats.clear': 'Limpar o histórico',
  'stats.goal': 'Meta de hoje',
  'stats.goalReached': 'Meta alcançada!',

  'notif.milestoneTitle': 'Faltam {m} minutos',
  'notif.milestoneBody': 'O tempo está passando, continue firme.',
  'notif.endTitle': 'Tempo esgotado',
  'notif.endBodyExtra': '+{m} min para terminar.',
  'notif.endBody': 'Faça uma pausa.',
  'notif.extraEndTitle': 'Tempo extra encerrado',
  'notif.nextBody': 'A seguir: {name}',
  'notif.channel.milestone': 'Marco de {m} min',
  'notif.channel.end': 'Fim do timer'
};

const ar: Dictionary = {
  'state.running': 'قيد التشغيل',
  'state.paused': 'متوقف مؤقتًا',
  'state.finished': 'انتهى',
  'state.ready': 'جاهز',
  'state.extra': 'وقت إضافي',
  'mode.custom': 'مخصص',
  'mode.extra': '+5 د',
  'cycle': 'الدورة {n}/{total}',

  'action.start': 'ابدأ',
  'action.pause': 'إيقاف مؤقت',
  'action.resume': 'استئناف',
  'action.reset': 'إعادة الضبط',
  'action.settings': 'الإعدادات',
  'action.close': 'إغلاق',
  'action.dialHint': 'اسحب على القرص لضبط الدقائق',
  'action.accessibilityInfo': 'عرض وثائق إمكانية الوصول RGAA 4.1',
  'action.accessibilityShort': 'إمكانية الوصول RGAA',

  'unit.minutes': 'دقيقة',

  'color.purple': 'بنفسجي',
  'color.red': 'أحمر',
  'color.orange': 'برتقالي',
  'color.amber': 'كهرماني',
  'color.lime': 'أخضر فاتح',
  'color.green': 'أخضر',
  'color.cyan': 'سماوي',
  'color.blue': 'أزرق',
  'color.magenta': 'أرجواني',
  'color.gray': 'رمادي',

  'tab.modes': 'الأوضاع',
  'tab.stats': 'الإحصاءات',
  'tab.settings': 'الإعدادات',

  'settings.dark': 'الوضع الداكن',
  'settings.sound': 'الصوت',
  'settings.autoExtra': '+5 دقائق تلقائيًا في النهاية',
  'settings.autoChain': 'تسلسل عمل ← استراحة',
  'settings.autoChainHint': 'استراحة طويلة كل {n} دورات',
  'settings.keepAwake': 'إبقاء الشاشة مضاءة',
  'settings.language': 'اللغة',
  'settings.languageAuto': 'تلقائي',
  'settings.listen': 'الاستماع إلى الأصوات',
  'settings.listenOne': 'تشغيل الصوت {label}',
  'settings.rgaaDocumentation': 'وثائق RGAA 4.1',
  'settings.duration': 'المدة',
  'settings.goal': 'الهدف اليومي',

  'preset.pomodoro': 'بومودورو',
  'preset.break': 'استراحة',
  'preset.longBreak': 'استراحة طويلة',
  'preset.focus': 'تركيز ADHD',
  'preset.new': 'وضع جديد',
  'preset.edit': 'تعديل {name}',
  'preset.name': 'الاسم',
  'preset.kind': 'النوع',
  'preset.kind.focus': 'عمل',
  'preset.kind.break': 'استراحة',
  'preset.kind.longBreak': 'استراحة طويلة',
  'preset.color': 'اللون',
  'preset.save': 'حفظ',
  'preset.cancel': 'إلغاء',
  'preset.delete': 'حذف',
  'preset.restore': 'استعادة الأوضاع الافتراضية',
  'preset.confirm': 'المس مرة أخرى للتأكيد',

  'stats.focus': 'التركيز اليوم',
  'stats.sessions': 'الجلسات',
  'stats.streak': 'السلسلة',
  'stats.streakValue': '{n} يوم',
  'stats.week': 'آخر 7 أيام',
  'stats.weekDay': 'يوم',
  'stats.weekMinutes': 'دقائق التركيز',
  'stats.weekLabel': '{day}: {m} دقيقة تركيز',
  'stats.recent': 'آخر الجلسات',
  'stats.empty': 'لا توجد جلسات بعد. ابدأ مؤقتًا!',
  'stats.completed': 'مكتملة',
  'stats.interrupted': 'متوقفة',
  'stats.clear': 'مسح السجل',
  'stats.goal': 'هدف اليوم',
  'stats.goalReached': 'تم بلوغ الهدف!',

  'notif.milestoneTitle': 'تبقّى {m} دقيقة',
  'notif.milestoneBody': 'الوقت يمضي، واصل التقدم.',
  'notif.endTitle': 'انتهى الوقت',
  'notif.endBodyExtra': '+{m} دقائق للإنهاء.',
  'notif.endBody': 'خذ استراحة.',
  'notif.extraEndTitle': 'انتهى الوقت الإضافي',
  'notif.nextBody': 'التالي: {name}',
  'notif.channel.milestone': 'تنبيه {m} دقيقة',
  'notif.channel.end': 'نهاية المؤقت'
};

const DICTIONARIES = { fr, en, es, de, it, pt, ar } as const;
export type Lang = keyof typeof DICTIONARIES;
export type LangChoice = Lang | 'auto';
export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' }
];

/** Langues écrites de droite à gauche. */
const RTL_LANGS: ReadonlySet<Lang> = new Set<Lang>(['ar']);

const LANG_KEY = 'lang';

function isLang(value: string | null): value is Lang {
  return value !== null && Object.hasOwn(DICTIONARIES, value);
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly choice = signal<LangChoice>(this.savedChoice());
  readonly lang = computed<Lang>(() => {
    const c = this.choice();
    return c === 'auto' ? this.systemLang() : c;
  });
  readonly dir = computed<'ltr' | 'rtl'>(() => (RTL_LANGS.has(this.lang()) ? 'rtl' : 'ltr'));

  setChoice(choice: LangChoice): void {
    this.choice.set(choice);
    writePref(LANG_KEY, choice);
    this.applyToDocument();
  }

  constructor() {
    this.applyToDocument();
  }

  t(key: I18nKey, params?: Record<string, string | number>): string {
    let text = DICTIONARIES[this.lang()][key] ?? fr[key];
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  }

  private applyToDocument(): void {
    document.documentElement.lang = this.lang();
    document.documentElement.dir = this.dir();
  }

  private savedChoice(): LangChoice {
    const saved = readPref(LANG_KEY);
    return isLang(saved) ? saved : 'auto';
  }

  /** Langue du système si elle est disponible, sinon l'anglais. */
  private systemLang(): Lang {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'fr'];
    for (const tag of langs) {
      const base = tag.toLowerCase().split('-')[0];
      if (isLang(base)) return base;
    }
    return 'en';
  }
}
