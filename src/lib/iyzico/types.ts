export interface IyzicoAddress {
  contactName: string
  city: string
  country: string
  address: string
  zipCode?: string
}

export interface IyzicoBuyer {
  id: string
  name: string
  surname: string
  gsmNumber: string
  email: string
  identityNumber: string
  registrationAddress: string
  ip: string
  city: string
  country: string
  zipCode?: string
}

export interface IyzicoBasketItem {
  id: string
  name: string
  category1: string
  itemType: 'PHYSICAL' | 'VIRTUAL'
  price: string
}

export interface IyzicoPaymentInitRequest {
  locale: string
  conversationId: string
  price: string
  paidPrice: string
  currency: string
  basketId: string
  paymentGroup: string
  callbackUrl: string
  buyer: IyzicoBuyer
  shippingAddress: IyzicoAddress
  billingAddress: IyzicoAddress
  basketItems: IyzicoBasketItem[]
}

export interface IyzicoPaymentInitResponse {
  status: 'success' | 'failure'
  errorCode?: string
  errorMessage?: string
  locale: string
  systemTime: number
  conversationId: string
  token?: string
  checkoutFormContent?: string
  tokenExpireTime?: number
  paymentPageUrl?: string
  isSandbox?: boolean
}

export interface IyzicoRetrieveResponse {
  status: 'success' | 'failure'
  paymentStatus?: 'SUCCESS' | 'FAILURE' | 'INIT_THREEDS' | 'CALLBACK_THREEDS'
  errorCode?: string
  errorMessage?: string
  conversationId?: string
  paymentId?: string
  price?: string
  paidPrice?: string
  currency?: string
  isSandbox?: boolean
}
