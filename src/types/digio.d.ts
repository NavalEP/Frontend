// Digio Web SDK TypeScript declarations
declare global {
  interface Window {
    Digio: typeof Digio;
  }
}

export interface DigioOptions {
  environment: 'sandbox' | 'production';
  callback: (response: DigioResponse) => void;
  logo?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
  };
  is_redirection_approach?: boolean;
  redirect_url?: string;
  is_iframe?: boolean;
  event_listener?: (event: DigioEvent) => void;
}

export interface DigioResponse {
  txn_id?: string;
  digio_doc_id?: string;
  message?: string;
  error_code?: string;
  method?: string;
}

export interface DigioEvent {
  documentId: string;
  txnId: string;
  entity: string;
  identifier: string;
  event: string;
  payload: any;
  type: 'error' | 'info';
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  event_filter?: {
    events: string[];
  };
}

export class Digio {
  constructor(options: DigioOptions);
  init(): void;
  submit(documentId: string | string[], identifier: string, tokenId?: string): void;
  cancel(): void;
}

export {};
