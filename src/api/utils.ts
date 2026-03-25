
export function addDays(daysToAdd: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date;
}

export function substractDays(daysToRemove: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysToRemove);
    return date;
}

export  async  function sleep(sec) {
    await new Promise(f => setTimeout(f, sec*1000));
}

export function process_column_values(columnName, columnCells){
    if (columnName.includes("Price")){
        columnCells=columnCells.map(t=>t.replaceAll(/[^\d.]/g, ""))
    }else if (columnName.includes("Date")){
        columnCells=columnCells.map(t=>convert_date_string_to_timestamp(t))
    }
    return columnCells;
}

function convert_date_string_to_timestamp(date_string){
    if (date_string!==""){
        const [month,day, year] = date_string.split("/").map(Number);
        const date = new Date(year, month - 1, day);
        return date.getTime()
    }
    return date_string;
}
