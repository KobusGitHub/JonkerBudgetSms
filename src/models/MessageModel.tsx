export interface MessageModel {
    id: string;
    sender: string;
    body: string;
    date: number;
    messageType: string;
    categoryName: string;
    categoryGuidId: string;
    onlyMarkAsCompleted: boolean;

}