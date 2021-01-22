interface IParticipant {
  id: string;
  name?: string;
  amount: number;
  role: PRole;
}

// Participant Role
enum PRole {
  Debtor = "debtor",
  Creditor = "creditor",
}

class Participant {
  static equals(p1: IParticipant, p2: IParticipant) {
    return p1.id === p2.id && p1.amount === p2.amount && p1.role === p2.role;
  }
}

export { IParticipant, PRole, Participant };
