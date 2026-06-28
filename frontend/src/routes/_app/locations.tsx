import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Train, Wrench, Factory, Users, Plus } from "lucide-react";
import { zones } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/locations")({
  head: () => ({ meta: [{ title: "Railway Locations · R-AMS" }] }),
  component: LocationsPage,
});

const tabs = [
  { v: "zones", label: "Zones", icon: MapPin },
  { v: "divisions", label: "Divisions", icon: Building2 },
  { v: "stations", label: "Stations", icon: Train },
  { v: "depots", label: "Depots", icon: Factory },
  { v: "workshops", label: "Workshops", icon: Wrench },
  { v: "departments", label: "Departments", icon: Users },
];

function LocationsPage() {
  return (
    <div>
      <PageHeader title="Railway Location Management"
        description="Hierarchy of zones, divisions, stations, depots, workshops and departments"
        actions={<Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Location</Button>} />
      <Tabs defaultValue="zones">
        <TabsList className="flex flex-wrap h-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.v} value={t.v}><t.icon className="mr-2 h-4 w-4" />{t.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="zones" className="mt-6">
          <Card><CardHeader><CardTitle className="text-base">Railway Zones</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>HQ</TableHead>
                  <TableHead>Divisions</TableHead><TableHead>Stations</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {zones.map((z) => (
                    <TableRow key={z.code}>
                      <TableCell className="font-mono text-primary">{z.code}</TableCell>
                      <TableCell className="font-medium">{z.name}</TableCell>
                      <TableCell>{z.hq}</TableCell>
                      <TableCell>{z.divisions}</TableCell>
                      <TableCell>{z.stations.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {tabs.slice(1).map((t) => (
          <TabsContent key={t.v} value={t.v} className="mt-6">
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              <t.icon className="mx-auto h-10 w-10 mb-3 text-primary" />
              <p>{t.label} directory will be listed here.</p>
            </CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
