import React, { useState } from "react";

import { Save, MapPin } from "lucide-react";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { Input } from "@/components/Input";
export function Settings() {
  const [activeTab, setActiveTab] = useState("Delivery");
  const tabs = ["Delivery"];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-ink">Delivery Settings</h2>
        <Button>
          <Save size={18} className="mr-2" /> Save Changes
        </Button>
      </div>

      <div className="flex space-x-1 border-b border-line overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-ink-soft hover:text-ink hover:border-line"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {activeTab === "Delivery" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Delivery Radius (km)
                  </label>
                  <Input type="number" defaultValue="15" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Base Delivery Fee (Rs.)
                  </label>
                  <Input type="number" defaultValue="250" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Coverage Area Preview
                </label>
                <div className="w-full h-64 bg-canvas rounded-card border border-line flex items-center justify-center relative overflow-hidden">
                  <div className="absolute w-48 h-48 bg-primary/20 rounded-full border-2 border-primary/50 flex items-center justify-center">
                    <MapPin className="text-primary" size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;

