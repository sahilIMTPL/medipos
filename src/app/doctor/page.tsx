"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DoctorLayout, { DoctorScreenId } from "@/components/DoctorLayout";
import DoctorPanelView from "@/components/DoctorPanelView";
import DoctorDashboardView from "@/components/DoctorDashboardView";
import DoctorPatientsHistoryView from "@/components/DoctorPatientsHistoryView";
import DoctorPrescriptionHistoryView from "@/components/DoctorPrescriptionHistoryView";
import DoctorDetailsView from "@/components/DoctorDetailsView";
import DoctorFormularyView from "@/components/DoctorFormularyView";
import { doctorApi, DoctorAuthUser } from "@/lib/api/doctor.api";
import { Loader2 } from "lucide-react";

export default function DoctorPage() {
  const router = useRouter();
  const [activeDoctor, setActiveDoctor] = useState<DoctorAuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeScreen, setActiveScreen] = useState<DoctorScreenId>("consultation");

  // State to pass to consultation desk if a doctor selects a patient or medicine from another tab
  const [consultPatient, setConsultPatient] = useState<any>(null);
  const [prescribeMedicine, setPrescribeMedicine] = useState<any>(null);

  useEffect(() => {
    const session = doctorApi.getStoredDoctorSession();
    if (!session) {
      router.replace("/doctor/login");
    } else {
      setActiveDoctor(session);
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs text-slate-500 font-medium">Verifying doctor clinical credentials...</p>
      </div>
    );
  }

  return (
    <DoctorLayout
      activeScreen={activeScreen}
      onNavigate={(screen) => setActiveScreen(screen)}
      doctor={activeDoctor}
    >
      {activeScreen === "consultation" && (
        <DoctorPanelView
          initialDoctor={activeDoctor}
          preselectedPatient={consultPatient}
          preselectedMedicine={prescribeMedicine}
          onNavigateToTab={(tab) => setActiveScreen(tab as DoctorScreenId)}
        />
      )}

      {activeScreen === "dashboard" && (
        <DoctorDashboardView
          doctor={activeDoctor}
          onNavigateToConsultation={() => setActiveScreen("consultation")}
          onNavigateToPatients={() => setActiveScreen("patients")}
          onNavigateToPrescriptions={() => setActiveScreen("prescriptions")}
        />
      )}

      {activeScreen === "patients" && (
        <DoctorPatientsHistoryView
          doctor={activeDoctor}
          onSelectPatientForConsultation={(p) => {
            setConsultPatient(p);
            setActiveScreen("consultation");
          }}
        />
      )}

      {activeScreen === "prescriptions" && (
        <DoctorPrescriptionHistoryView doctor={activeDoctor} />
      )}

      {activeScreen === "doctor-details" && (
        <DoctorDetailsView
          doctor={activeDoctor}
          onUpdateDoctor={(updated) => setActiveDoctor(updated)}
        />
      )}

      {activeScreen === "formulary" && (
        <DoctorFormularyView
          doctor={activeDoctor}
          onPrescribeMedicine={(med) => {
            setPrescribeMedicine(med);
            setActiveScreen("consultation");
          }}
        />
      )}
    </DoctorLayout>
  );
}
