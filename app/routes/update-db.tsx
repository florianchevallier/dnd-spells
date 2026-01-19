import type { ActionFunction } from "react-router";
import { Form, useActionData, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Loader2, Upload, Database, CheckCircle, AlertCircle } from "lucide-react";
import { promises as fs } from "fs";
import { spawn } from "child_process";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
  details?: string;
}

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const csvFile = formData.get("csvFile") as File;
    
    if (!csvFile || csvFile.size === 0) {
      return { error: "Veuillez sélectionner un fichier CSV" };
    }

    if (!csvFile.name.endsWith('.csv')) {
      return { error: "Le fichier doit être au format CSV" };
    }

    // Create temporary file path
    const tempDir = "/tmp";
    const fileName = `upload-${Date.now()}.csv`;
    const tempPath = `${tempDir}/${fileName}`;

    // Save uploaded file to temporary location
    const arrayBuffer = await csvFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(tempPath, buffer);
    
    return new Promise((resolve) => {
      const process = spawn("npm", ["run", "seed", tempPath], {
        stdio: "pipe",
        shell: true
      });

      let output = "";
      let errorOutput = "";

      process.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      process.stderr.on("data", (data: Buffer) => {
        errorOutput += data.toString();
      });

      process.on("close", (code: number) => {
        // Clean up temporary file
        fs.unlink(tempPath).catch(() => {});

        if (code === 0) {
          resolve({ 
            success: true, 
            message: "Base de données mise à jour avec succès !",
            output 
          });
        } else {
          resolve({ 
            error: "Erreur lors de la mise à jour de la base de données", 
            details: errorOutput 
          });
        }
      });

      process.on("error", (error: Error) => {
        // Clean up temporary file
        fs.unlink(tempPath).catch(() => {});
        resolve({ 
          error: "Erreur lors de l'exécution du script", 
          details: error.message 
        });
      });
    });
  } catch (error) {
    return { 
      error: "Erreur serveur", 
      details: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
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
              Importez un fichier CSV pour mettre à jour la liste des sorts de D&D 5e.
              Le fichier doit contenir les colonnes attendues par le script de seed.
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
                Format du fichier CSV attendu :
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Colonnes obligatoires : Nom, Niveau, Ecole, Classes, Description</li>
                <li>• Séparateur : pipe (|) ou virgule (,)</li>
                <li>• Encodage : UTF-8</li>
                <li>• Classes : séparées par des virgules</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}