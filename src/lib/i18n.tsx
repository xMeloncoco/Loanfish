import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoanDirection, LoanStatus } from './types'

export type Lang = 'en' | 'nl'

const STORAGE_KEY = 'loanfish:lang'

interface Strings {
  common: {
    save: string
    saving: string
    adding: string
    cancel: string
    edit: string
    delete: string
    deleting: string
    optional: string
    back: string
    me: string
  }
  layout: {
    signOut: string
    signOutWithEmail: (email: string) => string
    home: string
    items: string
    people: string
    loans: string
    history: string
  }
  status: Record<LoanStatus, string>
  direction: Record<LoanDirection, string>
  dueBadge: {
    noDate: string
    dueToday: string
    dueTomorrow: string
    daysLeft: (days: number) => string
    daysLate: (days: number) => string
    due: (date: string) => string
  }
  loanCard: {
    unknownPerson: string
    deletedItem: string
    with: (name: string) => string
    from: (name: string) => string
    since: (date: string) => string
  }
  dashboard: {
    greeting: (firstName: string | undefined) => string
    overdue: (count: number) => string
    onSchedule: string
    loanButton: string
    couldNotLoad: string
    borrowedFromOthers: string
    nothingBorrowedTitle: string
    nothingBorrowedBody: string
    lentOutToOthers: string
    nothingLentTitle: string
    nothingLentBody: string
  }
  items: {
    title: string
    subtitle: string
    itemButton: string
    couldNotLoad: string
    searchPlaceholder: string
    filterAll: string
    filterMine: string
    filterTheirs: string
    noItemsTitle: string
    noItemsBody: string
    noMatchTitle: string
    noMatchBody: string
    belongsTo: (name: string) => string
    yours: string
  }
  itemDetail: {
    couldNotLoad: string
    couldNotDelete: string
    notFound: string
    belongsTo: string
    yours: string
    viewCurrentLoan: string
    recordALoan: string
    description: string
    loanHistory: string
    neverLoanedTitle: string
    neverLoanedBody: string
    deleteTitle: (name: string) => string
    deleteBodyWithLoans: (count: number) => string
    deleteBodySimple: string
    deleteItemButton: string
    keepIt: string
  }
  itemForm: {
    editTitle: string
    newTitle: string
    changePhoto: string
    addPhoto: string
    remove: string
    nameLabel: string
    namePlaceholder: string
    ownerLabel: string
    ownerHint: string
    descriptionLabel: string
    descriptionPlaceholder: string
    couldNotLoadForm: string
    couldNotSave: string
    saveChanges: string
    addItem: string
    afterSaveHint: string
  }
  persons: {
    title: string
    subtitle: string
    personButton: string
    couldNotLoad: string
    searchPlaceholder: string
    noPeopleTitle: string
    noPeopleBody: string
    noMatchTitle: string
    noMatchBody: string
  }
  personDetail: {
    couldNotLoad: string
    couldNotDelete: string
    notFound: string
    nothingOutstanding: string
    openLoans: (count: number) => string
    recordALoan: string
    notes: string
    theyHaveFromYou: string
    nothingOutWithThem: string
    youHaveFromThem: string
    nothingBorrowedFromThem: string
    settled: string
    lentOutSubtitle: string
    borrowedSubtitle: string
    deleteTitle: (name: string) => string
    deleteLoanSentence: (count: number) => string
    deleteItemsSentence: (count: number) => string
    cannotBeUndone: string
    deletePersonAndLoans: (count: number) => string
    deletePerson: string
    keepThem: string
  }
  personForm: {
    editTitle: string
    newTitle: string
    subtitle: string
    nameLabel: string
    notesLabel: string
    notesPlaceholder: string
    couldNotLoad: string
    couldNotSave: string
    saveChanges: string
    addPerson: string
  }
  loanForm: {
    dueBeforeStart: string
    couldNotLoadForm: string
    couldNotSave: string
    newLoanTitle: string
    editLoanTitle: string
    quickAddItemTitle: string
    quickAddPersonTitle: string
    couldNotAddItem: string
    couldNotAddPerson: string
    whichWay: string
    lentItOut: string
    borrowedIt: string
    itemLabel: string
    chooseItem: string
    itemOwnerSuffix: (name: string) => string
    notInListItem: string
    addAnItemLink: string
    whoHasIt: string
    whoItCameFrom: string
    choosePerson: string
    notInListPerson: string
    addAPersonLink: string
    startDate: string
    backBy: string
    notesLabel: string
    notesPlaceholder: string
    ownerUpdateHint: (itemName: string, personName: string | undefined) => string
    saveChanges: string
    recordLoan: string
  }
  loanDetail: {
    couldNotLoad: string
    couldNotUpdate: string
    couldNotDelete: string
    notFound: string
    deletedItem: string
    lentTo: string
    borrowedFrom: string
    deletedPerson: string
    dueBack: (date: string) => string
    gotItBack: string
    gaveItBack: string
    markAsLost: string
    reopenLoan: string
    statusLabel: string
    started: string
    agreedReturn: string
    openEnded: string
    writtenOff: string
    returned: string
    item: string
    agreementAndNotes: string
    deleteTitle: string
    deleteBody: string
    deleteLoanButton: string
  }
  loansPage: {
    title: string
    subtitle: string
    loanButton: string
    couldNotLoad: string
    filterAll: string
    filterActive: string
    filterReturned: string
    filterLost: string
    filterLentOut: string
    filterBorrowed: string
    noLoansTitle: string
    noLoansBody: string
    noMatchTitle: string
  }
  history: {
    title: string
    subtitle: string
    couldNotLoad: string
    nothingYetTitle: string
    nothingYetBody: string
    eventCreated: string
    eventReturned: string
    eventLost: string
    deletedItem: string
  }
  login: {
    tagline: string
    yourName: string
    email: string
    password: string
    passwordHint: string
    couldNotCreateAccount: string
    wrongCredentials: string
    pleaseWait: string
    createAccount: string
    signIn: string
    alreadyHaveAccount: string
    noAccountYet: string
    createOne: string
  }
}

const en: Strings = {
  common: {
    save: 'Save',
    saving: 'Saving…',
    adding: 'Adding…',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    deleting: 'Deleting…',
    optional: 'optional',
    back: 'Back',
    me: 'Me',
  },
  layout: {
    signOut: 'Sign out',
    signOutWithEmail: (email) => `Sign out (${email})`,
    home: 'Home',
    items: 'Items',
    people: 'People',
    loans: 'Loans',
    history: 'History',
  },
  status: {
    active: 'Out',
    returned: 'Returned',
    lost: 'Lost',
  },
  direction: {
    lent_out: 'Lent out',
    borrowed: 'Borrowed',
  },
  dueBadge: {
    noDate: 'No date',
    dueToday: 'Due today',
    dueTomorrow: 'Due tomorrow',
    daysLeft: (days) => `${days} days left`,
    daysLate: (days) => (days === 1 ? '1 day late' : `${days} days late`),
    due: (date) => `Due ${date}`,
  },
  loanCard: {
    unknownPerson: 'Unknown person',
    deletedItem: 'Deleted item',
    with: (name) => `With ${name}`,
    from: (name) => `From ${name}`,
    since: (date) => `since ${date}`,
  },
  dashboard: {
    greeting: (firstName) => `Hi${firstName ? `, ${firstName}` : ''} 👋`,
    overdue: (count) => `${count} ${count === 1 ? 'loan is' : 'loans are'} past the agreed date.`,
    onSchedule: 'Everything is on schedule.',
    loanButton: 'Loan',
    couldNotLoad: 'Could not load your loans.',
    borrowedFromOthers: 'Borrowed from others',
    nothingBorrowedTitle: 'Nothing borrowed',
    nothingBorrowedBody: 'Things you have taken from other people show up here.',
    lentOutToOthers: 'Lent out to others',
    nothingLentTitle: 'Nothing lent out',
    nothingLentBody: 'Record a loan when you hand something over, so you remember who has it.',
  },
  items: {
    title: 'Items',
    subtitle: "Everything you track, yours and other people's.",
    itemButton: 'Item',
    couldNotLoad: 'Could not load your items.',
    searchPlaceholder: 'Search items…',
    filterAll: 'All',
    filterMine: 'Mine',
    filterTheirs: "Someone else's",
    noItemsTitle: 'No items yet',
    noItemsBody: 'Add the things you want to keep track of — then record a loan against them.',
    noMatchTitle: 'Nothing matches',
    noMatchBody: 'Try a different search or filter.',
    belongsTo: (name) => `Belongs to ${name}`,
    yours: 'Yours',
  },
  itemDetail: {
    couldNotLoad: 'Could not load this item.',
    couldNotDelete: 'Could not delete the item.',
    notFound: 'Item not found.',
    belongsTo: 'Belongs to',
    yours: 'Yours',
    viewCurrentLoan: 'View current loan',
    recordALoan: 'Record a loan',
    description: 'Description',
    loanHistory: 'Loan history',
    neverLoanedTitle: 'Never loaned',
    neverLoanedBody: 'This item has not been lent out or borrowed yet.',
    deleteTitle: (name) => `Delete ${name}?`,
    deleteBodyWithLoans: (count) =>
      `This also deletes ${count} loan ${count === 1 ? 'record' : 'records'} for this item. It cannot be undone.`,
    deleteBodySimple: 'This cannot be undone.',
    deleteItemButton: 'Delete item',
    keepIt: 'Keep it',
  },
  itemForm: {
    editTitle: 'Edit item',
    newTitle: 'New item',
    changePhoto: 'Change photo',
    addPhoto: 'Add photo',
    remove: 'Remove',
    nameLabel: 'Name',
    namePlaceholder: 'Drill, Dune (book), camping stove…',
    ownerLabel: 'Owner',
    ownerHint: 'Who this actually belongs to. Leave as “Me” for your own things.',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Colour, model, serial number, distinguishing scratches…',
    couldNotLoadForm: 'Could not load the form.',
    couldNotSave: 'Could not save the item.',
    saveChanges: 'Save changes',
    addItem: 'Add item',
    afterSaveHint: 'You can record a loan for this item straight after saving it.',
  },
  persons: {
    title: 'People',
    subtitle: "Your own list. They don't need an account.",
    personButton: 'Person',
    couldNotLoad: 'Could not load your people.',
    searchPlaceholder: 'Search people…',
    noPeopleTitle: 'No people yet',
    noPeopleBody: 'Add the people you lend things to and borrow things from.',
    noMatchTitle: 'Nothing matches',
    noMatchBody: 'Try a different search.',
  },
  personDetail: {
    couldNotLoad: 'Could not load this person.',
    couldNotDelete: 'Could not delete this person.',
    notFound: 'Person not found.',
    nothingOutstanding: 'Nothing outstanding',
    openLoans: (count) => `${count} open ${count === 1 ? 'loan' : 'loans'}`,
    recordALoan: 'Record a loan',
    notes: 'Notes',
    theyHaveFromYou: 'They have from you',
    nothingOutWithThem: 'Nothing out with them',
    youHaveFromThem: 'You have from them',
    nothingBorrowedFromThem: 'Nothing borrowed from them',
    settled: 'Settled',
    lentOutSubtitle: 'Lent out',
    borrowedSubtitle: 'Borrowed',
    deleteTitle: (name) => `Delete ${name}?`,
    deleteLoanSentence: (count) =>
      `A loan can't exist without the person on the other end, so their ${
        count === 1 ? 'loan will be deleted too' : `${count} loans will be deleted too`
      }.`,
    deleteItemsSentence: (count) =>
      `${count === 1 ? 'The item' : `The ${count} items`} marked as theirs will stay, listed as yours.`,
    cannotBeUndone: 'This cannot be undone.',
    deletePersonAndLoans: (count) => `Delete person and ${count} ${count === 1 ? 'loan' : 'loans'}`,
    deletePerson: 'Delete person',
    keepThem: 'Keep them',
  },
  personForm: {
    editTitle: 'Edit person',
    newTitle: 'New person',
    subtitle: 'Just for your own records — nothing is sent to them.',
    nameLabel: 'Name',
    notesLabel: 'Notes',
    notesPlaceholder: 'How you know them, how to reach them, anything worth remembering.',
    couldNotLoad: 'Could not load this person.',
    couldNotSave: 'Could not save this person.',
    saveChanges: 'Save changes',
    addPerson: 'Add person',
  },
  loanForm: {
    dueBeforeStart: 'The return date cannot be before the start date.',
    couldNotLoadForm: 'Could not load the form.',
    couldNotSave: 'Could not save the loan.',
    newLoanTitle: 'New loan',
    editLoanTitle: 'Edit loan',
    quickAddItemTitle: 'Add an item',
    quickAddPersonTitle: 'Add a person',
    couldNotAddItem: 'Could not add the item.',
    couldNotAddPerson: 'Could not add the person.',
    whichWay: 'Which way?',
    lentItOut: 'I lent it out',
    borrowedIt: 'I borrowed it',
    itemLabel: 'Item',
    chooseItem: 'Choose an item…',
    itemOwnerSuffix: (name) => `(${name}'s)`,
    notInListItem: 'Not in the list?',
    addAnItemLink: 'Add an item',
    whoHasIt: 'Who has it',
    whoItCameFrom: 'Who it came from',
    choosePerson: 'Choose a person…',
    notInListPerson: 'Not in the list?',
    addAPersonLink: 'Add a person',
    startDate: 'Start date',
    backBy: 'Back by',
    notesLabel: 'Notes',
    notesPlaceholder: 'Paste what you agreed — conditions, deposit, the message thread…',
    ownerUpdateHint: (itemName, personName) =>
      `“${itemName}” is currently marked as yours. Set its owner to ${personName ?? ''} as well.`,
    saveChanges: 'Save changes',
    recordLoan: 'Record loan',
  },
  loanDetail: {
    couldNotLoad: 'Could not load this loan.',
    couldNotUpdate: 'Could not update the loan.',
    couldNotDelete: 'Could not delete the loan.',
    notFound: 'Loan not found.',
    deletedItem: 'Deleted item',
    lentTo: 'Lent to',
    borrowedFrom: 'Borrowed from',
    deletedPerson: 'someone who has been deleted',
    dueBack: (date) => `This was due back on ${date}.`,
    gotItBack: 'Got it back',
    gaveItBack: 'Gave it back',
    markAsLost: 'Mark as lost',
    reopenLoan: 'Re-open loan',
    statusLabel: 'Status',
    started: 'Started',
    agreedReturn: 'Agreed return',
    openEnded: 'Open-ended',
    writtenOff: 'Written off',
    returned: 'Returned',
    item: 'Item',
    agreementAndNotes: 'Agreement & notes',
    deleteTitle: 'Delete this loan?',
    deleteBody: 'The item and the person stay — only this loan record goes. This cannot be undone.',
    deleteLoanButton: 'Delete loan',
  },
  loansPage: {
    title: 'Loans',
    subtitle: 'Everything you have out or holding, active or resolved.',
    loanButton: 'Loan',
    couldNotLoad: 'Could not load your loans.',
    filterAll: 'All',
    filterActive: 'Still out',
    filterReturned: 'Returned',
    filterLost: 'Lost',
    filterLentOut: 'Lent out',
    filterBorrowed: 'Borrowed',
    noLoansTitle: 'No loans yet',
    noLoansBody:
      'Record a loan to start keeping track — you can add the item and person for it right from that form.',
    noMatchTitle: 'Nothing in this filter',
  },
  history: {
    title: 'History',
    subtitle: 'Everything that has happened to your loans, newest first.',
    couldNotLoad: 'Could not load your loan history.',
    nothingYetTitle: 'Nothing yet',
    nothingYetBody: 'Record a loan on the Loans page and its story starts showing up here.',
    eventCreated: 'Loan recorded',
    eventReturned: 'Marked returned',
    eventLost: 'Marked lost',
    deletedItem: 'Deleted item',
  },
  login: {
    tagline: 'Never lose track of who has your stuff.',
    yourName: 'Your name',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 8 characters.',
    couldNotCreateAccount: 'Could not create the account.',
    wrongCredentials: 'Wrong email or password.',
    pleaseWait: 'Please wait…',
    createAccount: 'Create account',
    signIn: 'Sign in',
    alreadyHaveAccount: 'Already have an account?',
    noAccountYet: 'No account yet?',
    createOne: 'Create one',
  },
}

const nl: Strings = {
  common: {
    save: 'Opslaan',
    saving: 'Opslaan…',
    adding: 'Toevoegen…',
    cancel: 'Annuleren',
    edit: 'Bewerken',
    delete: 'Verwijderen',
    deleting: 'Verwijderen…',
    optional: 'optioneel',
    back: 'Terug',
    me: 'Ik',
  },
  layout: {
    signOut: 'Uitloggen',
    signOutWithEmail: (email) => `Uitloggen (${email})`,
    home: 'Start',
    items: 'Spullen',
    people: 'Mensen',
    loans: 'Leningen',
    history: 'Geschiedenis',
  },
  status: {
    active: 'Uitgeleend',
    returned: 'Terug',
    lost: 'Kwijt',
  },
  direction: {
    lent_out: 'Uitgeleend',
    borrowed: 'Geleend',
  },
  dueBadge: {
    noDate: 'Geen datum',
    dueToday: 'Vandaag terug',
    dueTomorrow: 'Morgen terug',
    daysLeft: (days) => `Nog ${days} dagen`,
    daysLate: (days) => (days === 1 ? '1 dag te laat' : `${days} dagen te laat`),
    due: (date) => `Terug op ${date}`,
  },
  loanCard: {
    unknownPerson: 'Onbekend persoon',
    deletedItem: 'Verwijderd item',
    with: (name) => `Bij ${name}`,
    from: (name) => `Van ${name}`,
    since: (date) => `sinds ${date}`,
  },
  dashboard: {
    greeting: (firstName) => `Hoi${firstName ? `, ${firstName}` : ''} 👋`,
    overdue: (count) =>
      `${count} ${count === 1 ? 'lening is' : 'leningen zijn'} over de afgesproken datum heen.`,
    onSchedule: 'Alles ligt op schema.',
    loanButton: 'Lening',
    couldNotLoad: 'Kon je leningen niet laden.',
    borrowedFromOthers: 'Geleend van anderen',
    nothingBorrowedTitle: 'Niets geleend',
    nothingBorrowedBody: 'Dingen die je van anderen hebt overgenomen, verschijnen hier.',
    lentOutToOthers: 'Uitgeleend aan anderen',
    nothingLentTitle: 'Niets uitgeleend',
    nothingLentBody: 'Leg een lening vast wanneer je iets uit handen geeft, zodat je weet wie het heeft.',
  },
  items: {
    title: 'Spullen',
    subtitle: 'Alles wat je bijhoudt, van jou en van anderen.',
    itemButton: 'Item',
    couldNotLoad: 'Kon je items niet laden.',
    searchPlaceholder: 'Zoek items…',
    filterAll: 'Alles',
    filterMine: 'Van mij',
    filterTheirs: 'Van iemand anders',
    noItemsTitle: 'Nog geen items',
    noItemsBody: 'Voeg de dingen toe die je wilt bijhouden — leg er daarna een lening op vast.',
    noMatchTitle: 'Niets gevonden',
    noMatchBody: 'Probeer een andere zoekterm of filter.',
    belongsTo: (name) => `Eigendom van ${name}`,
    yours: 'Van jou',
  },
  itemDetail: {
    couldNotLoad: 'Kon dit item niet laden.',
    couldNotDelete: 'Kon het item niet verwijderen.',
    notFound: 'Item niet gevonden.',
    belongsTo: 'Eigendom van',
    yours: 'Van jou',
    viewCurrentLoan: 'Bekijk huidige lening',
    recordALoan: 'Lening vastleggen',
    description: 'Omschrijving',
    loanHistory: 'Leengeschiedenis',
    neverLoanedTitle: 'Nooit uitgeleend',
    neverLoanedBody: 'Dit item is nog niet uitgeleend of geleend.',
    deleteTitle: (name) => `${name} verwijderen?`,
    deleteBodyWithLoans: (count) =>
      `Dit verwijdert ook ${count} leen${count === 1 ? 'record' : 'records'} voor dit item. Dit kan niet ongedaan worden gemaakt.`,
    deleteBodySimple: 'Dit kan niet ongedaan worden gemaakt.',
    deleteItemButton: 'Item verwijderen',
    keepIt: 'Toch behouden',
  },
  itemForm: {
    editTitle: 'Item bewerken',
    newTitle: 'Nieuw item',
    changePhoto: 'Foto wijzigen',
    addPhoto: 'Foto toevoegen',
    remove: 'Verwijderen',
    nameLabel: 'Naam',
    namePlaceholder: 'Boormachine, Dune (boek), campingkooktoestel…',
    ownerLabel: 'Eigenaar',
    ownerHint: 'Van wie dit eigenlijk is. Laat op “Ik” staan voor je eigen spullen.',
    descriptionLabel: 'Omschrijving',
    descriptionPlaceholder: 'Kleur, model, serienummer, onderscheidende krassen…',
    couldNotLoadForm: 'Kon het formulier niet laden.',
    couldNotSave: 'Kon het item niet opslaan.',
    saveChanges: 'Wijzigingen opslaan',
    addItem: 'Item toevoegen',
    afterSaveHint: 'Je kunt direct na het opslaan een lening voor dit item vastleggen.',
  },
  persons: {
    title: 'Mensen',
    subtitle: 'Je eigen lijst. Zij hebben geen account nodig.',
    personButton: 'Persoon',
    couldNotLoad: 'Kon je mensen niet laden.',
    searchPlaceholder: 'Zoek mensen…',
    noPeopleTitle: 'Nog geen mensen',
    noPeopleBody: 'Voeg de mensen toe aan wie je dingen uitleent en van wie je dingen leent.',
    noMatchTitle: 'Niets gevonden',
    noMatchBody: 'Probeer een andere zoekterm.',
  },
  personDetail: {
    couldNotLoad: 'Kon deze persoon niet laden.',
    couldNotDelete: 'Kon deze persoon niet verwijderen.',
    notFound: 'Persoon niet gevonden.',
    nothingOutstanding: 'Niets openstaand',
    openLoans: (count) => `${count} open${count === 1 ? 'staande lening' : 'staande leningen'}`,
    recordALoan: 'Lening vastleggen',
    notes: 'Notities',
    theyHaveFromYou: 'Zij hebben van jou',
    nothingOutWithThem: 'Niets bij hen uitstaand',
    youHaveFromThem: 'Jij hebt van hen',
    nothingBorrowedFromThem: 'Niets van hen geleend',
    settled: 'Afgehandeld',
    lentOutSubtitle: 'Uitgeleend',
    borrowedSubtitle: 'Geleend',
    deleteTitle: (name) => `${name} verwijderen?`,
    deleteLoanSentence: (count) =>
      `Een lening kan niet bestaan zonder de persoon aan de andere kant, dus ${
        count === 1 ? 'de bijbehorende lening wordt ook verwijderd' : `de bijbehorende ${count} leningen worden ook verwijderd`
      }.`,
    deleteItemsSentence: (count) =>
      `${count === 1 ? 'Het item' : `De ${count} items`} dat als van hen staat gemarkeerd, blijft bestaan, voortaan op jouw naam.`,
    cannotBeUndone: 'Dit kan niet ongedaan worden gemaakt.',
    deletePersonAndLoans: (count) =>
      `Persoon en ${count} ${count === 1 ? 'lening' : 'leningen'} verwijderen`,
    deletePerson: 'Persoon verwijderen',
    keepThem: 'Toch behouden',
  },
  personForm: {
    editTitle: 'Persoon bewerken',
    newTitle: 'Nieuw persoon',
    subtitle: 'Alleen voor je eigen administratie — er wordt niets naar hen verstuurd.',
    nameLabel: 'Naam',
    notesLabel: 'Notities',
    notesPlaceholder: 'Hoe je hen kent, hoe je hen kunt bereiken, alles wat het onthouden waard is.',
    couldNotLoad: 'Kon deze persoon niet laden.',
    couldNotSave: 'Kon deze persoon niet opslaan.',
    saveChanges: 'Wijzigingen opslaan',
    addPerson: 'Persoon toevoegen',
  },
  loanForm: {
    dueBeforeStart: 'De retourdatum kan niet vóór de startdatum liggen.',
    couldNotLoadForm: 'Kon het formulier niet laden.',
    couldNotSave: 'Kon de lening niet opslaan.',
    newLoanTitle: 'Nieuwe lening',
    editLoanTitle: 'Lening bewerken',
    quickAddItemTitle: 'Item toevoegen',
    quickAddPersonTitle: 'Persoon toevoegen',
    couldNotAddItem: 'Kon het item niet toevoegen.',
    couldNotAddPerson: 'Kon de persoon niet toevoegen.',
    whichWay: 'Welke kant op?',
    lentItOut: 'Ik heb het uitgeleend',
    borrowedIt: 'Ik heb het geleend',
    itemLabel: 'Item',
    chooseItem: 'Kies een item…',
    itemOwnerSuffix: (name) => `(van ${name})`,
    notInListItem: 'Staat het er niet bij?',
    addAnItemLink: 'Item toevoegen',
    whoHasIt: 'Wie heeft het',
    whoItCameFrom: 'Van wie het kwam',
    choosePerson: 'Kies een persoon…',
    notInListPerson: 'Staat diegene er niet bij?',
    addAPersonLink: 'Persoon toevoegen',
    startDate: 'Startdatum',
    backBy: 'Terug voor',
    notesLabel: 'Notities',
    notesPlaceholder: 'Plak wat jullie hebben afgesproken — voorwaarden, borg, het berichtengesprek…',
    ownerUpdateHint: (itemName, personName) =>
      `“${itemName}” staat momenteel als van jou gemarkeerd. Zet de eigenaar ook op ${personName ?? ''}.`,
    saveChanges: 'Wijzigingen opslaan',
    recordLoan: 'Lening vastleggen',
  },
  loanDetail: {
    couldNotLoad: 'Kon deze lening niet laden.',
    couldNotUpdate: 'Kon de lening niet bijwerken.',
    couldNotDelete: 'Kon de lening niet verwijderen.',
    notFound: 'Lening niet gevonden.',
    deletedItem: 'Verwijderd item',
    lentTo: 'Uitgeleend aan',
    borrowedFrom: 'Geleend van',
    deletedPerson: 'iemand die is verwijderd',
    dueBack: (date) => `Dit moest op ${date} terug zijn.`,
    gotItBack: 'Teruggekregen',
    gaveItBack: 'Teruggegeven',
    markAsLost: 'Markeer als kwijt',
    reopenLoan: 'Lening heropenen',
    statusLabel: 'Status',
    started: 'Gestart',
    agreedReturn: 'Afgesproken retour',
    openEnded: 'Geen einddatum',
    writtenOff: 'Afgeschreven',
    returned: 'Teruggekregen',
    item: 'Item',
    agreementAndNotes: 'Afspraak & notities',
    deleteTitle: 'Deze lening verwijderen?',
    deleteBody:
      'Het item en de persoon blijven bestaan — alleen dit leenrecord verdwijnt. Dit kan niet ongedaan worden gemaakt.',
    deleteLoanButton: 'Lening verwijderen',
  },
  loansPage: {
    title: 'Leningen',
    subtitle: 'Alles wat je hebt uitstaan of onder je hebt, actief of afgehandeld.',
    loanButton: 'Lening',
    couldNotLoad: 'Kon je leningen niet laden.',
    filterAll: 'Alles',
    filterActive: 'Nog uitstaand',
    filterReturned: 'Teruggekregen',
    filterLost: 'Kwijt',
    filterLentOut: 'Uitgeleend',
    filterBorrowed: 'Geleend',
    noLoansTitle: 'Nog geen leningen',
    noLoansBody:
      'Leg een lening vast om te beginnen met bijhouden — je kunt het item en de persoon meteen vanuit dat formulier toevoegen.',
    noMatchTitle: 'Niets in dit filter',
  },
  history: {
    title: 'Geschiedenis',
    subtitle: 'Alles wat er met je leningen is gebeurd, nieuwste eerst.',
    couldNotLoad: 'Kon je leengeschiedenis niet laden.',
    nothingYetTitle: 'Nog niets',
    nothingYetBody: 'Leg een lening vast op de Leningen-pagina en het verhaal verschijnt hier.',
    eventCreated: 'Lening vastgelegd',
    eventReturned: 'Gemarkeerd als teruggekregen',
    eventLost: 'Gemarkeerd als kwijt',
    deletedItem: 'Verwijderd item',
  },
  login: {
    tagline: 'Verlies nooit meer uit het oog wie jouw spullen heeft.',
    yourName: 'Je naam',
    email: 'E-mailadres',
    password: 'Wachtwoord',
    passwordHint: 'Minstens 8 tekens.',
    couldNotCreateAccount: 'Kon het account niet aanmaken.',
    wrongCredentials: 'Onjuist e-mailadres of wachtwoord.',
    pleaseWait: 'Even geduld…',
    createAccount: 'Account aanmaken',
    signIn: 'Inloggen',
    alreadyHaveAccount: 'Heb je al een account?',
    noAccountYet: 'Nog geen account?',
    createOne: 'Maak er een aan',
  },
}

const dictionaries: Record<Lang, Strings> = { en, nl }

function detectDefaultLang(): Lang {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('nl')) {
    return 'nl'
  }
  return 'en'
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Strings
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en'
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'nl') return stored
    return detectDefaultLang()
  })

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: dictionaries[lang] }),
    [lang, setLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside an I18nProvider')
  return context
}
