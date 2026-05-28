```typescript
import React from 'react';
import { useState } from 'react';
import { Devis } from '../types/Devis';

interface DevisTableProps {
  devis: Devis[];
}

const DevisTable: React.FC<DevisTableProps> = ({ devis }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto w-full text-sm md:text-base">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Référence Client</th>
            <th className="px-4 py-2">Évènement</th>
            <th className="px-4 py-2">Date</th>
            {/* Ajout d'autres colonnes si nécessaire */}
          </tr>
        </thead>
        <tbody>
          {devis.map((devis) => (
            <tr key={devis.id}>
              <td className="px-4 py-2 whitespace-nowrap sm:whitespace-normal md:whitespace-normal">{devis.referenceClient}</td>
              <td className="px-4 py-2">{devis.evenement}</td>
              <td className="px-4 py-2">{devis.date}</td>
              {/* Ajout d'autres colonnes si nécessaire */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DevisTable;
```