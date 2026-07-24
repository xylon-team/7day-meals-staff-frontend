import React, { useState, useEffect } from "react";
import { Save, MapPin, Loader2, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { Input } from "@/components/Input";
import { useUserStore } from "@/store/user-store";
import { getSettings, createSettings, updateSettings } from "@/lib/api/settings";

export function Settings() {
  const [activeTab, setActiveTab] = useState("Delivery");
  const tabs = ["Delivery"];

  const { user } = useUserStore();

  // Settings states
  const [deliveryRadius, setDeliveryRadius] = useState<string>("15");
  const [deliveryFee, setDeliveryFee] = useState<string>("250");
  const [latitude, setLatitude] = useState<string>("6.9271");
  const [longitude, setLongitude] = useState<string>("79.8612");

  // UX states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean>(true);

  useEffect(() => {
    const fetchSettingsData = async () => {
      if (!user?.accessToken) {
        setError("You must be logged in as an administrator to load settings.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getSettings(user.accessToken);

        setDeliveryRadius(String(data.delivery_radius));
        setDeliveryFee(String(data.delivery_fee));
        setLatitude(String(data.latitude));
        setLongitude(String(data.longitude));
        setExists(true);
      } catch (err) {
        const errorObject = err as Error;
        if (errorObject.message === "404_NOT_FOUND") {
          // If no settings exist yet, we keep default fallback values
          setExists(false);
        } else {
          setError(errorObject.message || "Failed to load settings from server.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettingsData();
  }, [user?.accessToken]);

  const handleSaveSettings = async () => {
    if (!user?.accessToken) {
      setError("You must be logged in as an administrator to save settings.");
      return;
    }

    // Input Validation
    const radius = parseInt(deliveryRadius, 10);
    const fee = parseFloat(deliveryFee);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(radius) || radius < 0) {
      setError("Delivery Radius must be a valid non-negative integer.");
      return;
    }

    if (isNaN(fee) || fee < 0) {
      setError("Base Delivery Fee must be a valid non-negative number.");
      return;
    }

    if (isNaN(lat)) {
      setError("Kitchen Latitude must be a valid number.");
      return;
    }

    if (isNaN(lng)) {
      setError("Kitchen Longitude must be a valid number.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const requestPayload = {
        delivery_radius: radius,
        delivery_fee: fee,
        latitude: lat,
        longitude: lng,
      };

      if (exists) {
        await updateSettings(user.accessToken, requestPayload);
        setSuccess("Settings updated successfully!");
      } else {
        await createSettings(user.accessToken, requestPayload);
        setSuccess("Settings initialized and saved successfully!");
        setExists(true);
      }

      // Auto-clear success message after 4 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 4000);
    } catch (err) {
      const errorObject = err as Error;
      setError(errorObject.message || "Failed to save settings to the server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-ink">Delivery Settings</h2>
        <Button
          disabled={isLoading || isSaving}
          onClick={handleSaveSettings}
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} /> Saving...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" /> Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="flex space-x-1 border-b border-line overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab
              ? "border-primary text-primary"
              : "border-transparent text-ink-soft hover:text-ink hover:border-line"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-danger-bg border border-danger-fg/20 rounded-card flex items-start gap-3 text-danger-fg">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Error</h4>
            <p className="text-xs mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-success-bg border border-success-fg/20 rounded-card flex items-start gap-3 text-success-fg">
          <CheckCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Success</h4>
            <p className="text-xs mt-1 opacity-90">{success}</p>
          </div>
        </div>
      )}

      {!isLoading && !exists && !error && !success && (
        <div className="p-4 bg-warning-bg border border-warning-fg/20 rounded-card flex items-start gap-3 text-warning-fg">
          <Info size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Settings Not Initialized</h4>
            <p className="text-xs mt-1 opacity-90">
              Settings are not initialized on the server database. Showing fallback default settings. Save changes to initialize.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-ink-soft font-medium">Settings loading...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            {activeTab === "Delivery" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Delivery Radius (km)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={deliveryRadius}
                      onChange={(e) => setDeliveryRadius(e.target.value)}
                      placeholder="e.g. 15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Base Delivery Fee (Rs.)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      placeholder="e.g. 250"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">
                        Kitchen Latitude
                      </label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g. 6.9271"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">
                        Kitchen Longitude
                      </label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g. 79.8612"
                      />
                    </div>
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
                    <div className="absolute bottom-3 left-3 bg-card px-2.5 py-1.5 rounded-control text-xs font-semibold text-ink-soft border border-line shadow-sm">
                      Radius: {deliveryRadius || '0'} km
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Settings;


