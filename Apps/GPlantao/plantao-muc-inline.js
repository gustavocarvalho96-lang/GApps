var MUC_OPTIONS = [
  "Losartana", "Enalapril", "Captopril", "Anlodipino", "Hidroclorotiazida",
  "Clortalidona", "Furosemida", "Espironolactona", "Atenolol", "Carvedilol",
  "Metoprolol", "Propranolol", "Metformina", "Gliclazida", "Glibenclamida",
  "Dapagliflozina", "Empagliflozina", "Insulina NPH", "Insulina regular",
  "Insulina glargina", "Sinvastatina", "Atorvastatina", "Rosuvastatina",
  "AAS", "Clopidogrel", "Rivaroxabana", "Apixabana", "Varfarina",
  "Levotiroxina", "Omeprazol", "Pantoprazol", "Sertralina", "Fluoxetina",
  "Escitalopram", "Amitriptilina", "Clonazepam", "Diazepam", "Carbamazepina",
  "Ácido valproico", "Fenobarbital", "Levetiracetam", "Salbutamol",
  "Budesonida", "Formoterol", "Tiotrópio", "Alopurinol"
].map(function (medicine) {
  var aliases = {
    "AAS": "ácido acetilsalicílico aspirina",
    "Anlodipino": "amlodipina amlodipino",
    "Ácido valproico": "valproato"
  };
  return { label: medicine, text: medicine, search: aliases[medicine] || "" };
});

function mountInlineMuc(area) {
  mountInlineClinicalList(area, {
    section: "MUC",
    title: "Medicamentos de uso contínuo",
    options: MUC_OPTIONS,
    negative: "Nega uso de medicações contínuas"
  });
}
