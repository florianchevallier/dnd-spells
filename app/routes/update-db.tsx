import type { ActionFunction } from "react-router";
import { Form, useActionData, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Loader2, Upload, Database, CheckCircle, AlertCircle } from "lucide-react";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
  details?: string;
}

export const action: ActionFunction = async (args) => {
  const { action } = await import("~/lib/update-db.server");
  return action(args);
};

export default function UpdateDatabase() {
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Mettre à jour la base de données
            </CardTitle>
            <CardDescription>
              Importez un fichier CSV pour mettre à jour la base de données.
              Trois types de fichiers sont supportés : les sorts (colonnes Nom, Niveau, Ecole, Classes, etc.),
              les emplacements de sorts par classe/sous-classe (Classe, Sous_Classe, Niveau, Niv_1 à Niv_9),
              et les monstres (name, type, details_json, sections_json, etc.).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form
              method="post"
              encType="multipart/form-data"
              className="space-y-6"
            >
              <div className="space-y-2">
                <label htmlFor="csvFile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Fichier CSV
                </label>
                <Input
                  id="csvFile"
                  name="csvFile"
                  type="file"
                  accept=".csv"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importation en cours...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer le CSV
                  </>
                )}
              </Button>
            </Form>

            {actionData && (
              <div className="mt-6">
                {actionData.success ? (
                  <div className="relative w-full rounded-lg border border-green-200 bg-green-50 p-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="text-sm text-green-800">
                      {actionData.message}
                      {actionData.details && (
                        <div className="mt-2 text-xs text-green-700 font-mono bg-green-100 p-2 rounded">
                          {actionData.details}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full rounded-lg border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="text-sm text-red-800">
                      <strong>{actionData.error}</strong>
                      {actionData.details && (
                        <div className="mt-2 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                          {actionData.details}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-sm text-gray-700 mb-2">
                Formats de fichiers CSV acceptés :
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">1. Fichier de sorts :</p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4">
                    <li>• Colonnes obligatoires : Nom, Niveau, Ecole, Classes, Description</li>
                    <li>• Recréé complètement les tables spells, classes et spell_classes</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">2. Fichier d'emplacements de sorts :</p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4">
                    <li>• Colonnes obligatoires : Classe, Sous_Classe, Niveau, Niv_1 à Niv_9</li>
                    <li>• Met à jour les tables subclasses et class_spell_slots</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">3. Fichier de monstres :</p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4">
                    <li>• Colonnes obligatoires : name, type, details_json, sections_json</li>
                    <li>• Upsert sur le nom pour préserver les IDs existants et les favoris associés</li>
                    <li>• Supprime les monstres absents du CSV importé</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-gray-600">• Séparateur détecté automatiquement (|, virgule, point-virgule ou tabulation)</p>
                  <p className="text-xs text-gray-600">• Encodage : UTF-8</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
