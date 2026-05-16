export const formatDate = (date:Date):string =>{
    return date.toISOString();
}

export const generatedID = ():string =>{
    return Math.random().toString(36).substring(2,9);
}