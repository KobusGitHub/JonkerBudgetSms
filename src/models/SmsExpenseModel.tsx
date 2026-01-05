export interface SmsExpenseModel {
    smsId: string;
    smsBody: string;
    categoryName: string;
    categoryGuidId: string;
    amount: number;
    comment: string;
    onlyMarkAsCompleted: boolean;
    year: number
    month: string;
    guidId: string;
    shareToken: string;
}