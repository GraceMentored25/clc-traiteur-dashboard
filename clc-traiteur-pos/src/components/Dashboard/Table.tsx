// contenu complet du fichier
import React from 'react';
import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';

const DashboardTable = () => {
  const { clients, events } = useStore();
  const [tableData, setTableData] = useState([] as any[]);

  useEffect(() => {
    const data = clients.map((client: any) => {
      const event = events.find((e: any) => e.clientId === client.id);
      return {
        client: client.name,
        event: event ? event.name : '',
        date: event ? event.date : '',
      };
    });
    setTableData(data);
  }, [clients, events]);

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Clients</Th>
          <Th ml={4}>Événements</Th>
          <Th>Date</Th>
        </Tr>
      </Thead>
      <Tbody>
        {tableData.map((row: any, index: number) => (
          <Tr key={index}>
            <Td>{row.client}</Td>
            <Td>{row.event}</Td>
            <Td maxW="200px" isTruncated>
              {row.date}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default DashboardTable;