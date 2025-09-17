type LeadMethod = (...args: any[]) => any;

type LeadMocks = Record<string, LeadMethod>;

const defaultHandler = (name: string) => {
  return () => {
    throw new Error(`${name} mock not implemented`);
  };
};

const leadMocks: LeadMocks = {
  findFirst: defaultHandler("findFirst"),
  findUnique: defaultHandler("findUnique"),
  updateMany: defaultHandler("updateMany"),
  delete: defaultHandler("delete"),
};

export const prisma = {
  lead: {
    findFirst: (...args: any[]) => leadMocks.findFirst(...args),
    findUnique: (...args: any[]) => leadMocks.findUnique(...args),
    updateMany: (...args: any[]) => leadMocks.updateMany(...args),
    delete: (...args: any[]) => leadMocks.delete(...args),
  },
};

export function __setLeadMock(name: keyof typeof leadMocks, fn: LeadMethod) {
  leadMocks[name] = fn;
}

export function __resetLeadMocks() {
  leadMocks.findFirst = defaultHandler("findFirst");
  leadMocks.findUnique = defaultHandler("findUnique");
  leadMocks.updateMany = defaultHandler("updateMany");
  leadMocks.delete = defaultHandler("delete");
}
