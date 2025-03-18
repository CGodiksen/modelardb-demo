export interface TableSchema {
  name: string;
  columns: TableColumn[];
}

interface TableColumn {
  name: string;
  data_type: string;
}
