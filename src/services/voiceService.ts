import { ChatMessage } from '../types';

export class VoiceService {
  private static initialMessages: ChatMessage[] = [
    {
      id: 'msg_0',
      sender: 'assistant',
      text: 'Namaste! I am SASHTYA, your healthcare navigation assistant. How can I help you today? You can ask about your upcoming appointments, medicines, emergency profile, or insurance claims.',
      timestamp: 'Just now',
      suggestedActions: [
        { label: '💊 Next medicine time?', action: 'medicine' },
        { label: '🩺 When is my appointment?', action: 'appointment' },
        { label: '🚨 Open Emergency Card', action: 'emergency' },
        { label: '💳 Check Insurance Status', action: 'insurance' }
      ]
    }
  ];

  static getInitialMessages(): ChatMessage[] {
    return this.initialMessages;
  }

  static processUserInput(query: string, language: 'en' | 'hi' | 'bn' | 'or' = 'en'): ChatMessage {
    const lower = query.toLowerCase();
    let text = '';
    let actions: { label: string; action: string }[] | undefined = undefined;

    // AI Safety Guardrail - Medical Diagnosis Check (Section 53 & 54)
    if (
      lower.includes('what disease') || 
      lower.includes('diagnose') || 
      lower.includes('chest pain symptom') || 
      lower.includes('cancer') || 
      lower.includes('what illness') ||
      lower.includes('b बीमारी') ||
      lower.includes('कौन सी बीमारी')
    ) {
      text = "I cannot diagnose medical conditions or give clinical advice. If you are feeling unwell or having urgent symptoms, please consult a qualified doctor or press our red Emergency button right now for immediate assistance.";
      actions = [
        { label: '🚨 Activate Emergency Assistance', action: 'emergency' },
        { label: '🏥 Find Nearby Hospitals', action: 'hospitals' }
      ];
    } else if (
      lower.includes('emergency') || 
      lower.includes('accident') || 
      lower.includes('ambulance') || 
      lower.includes('108') ||
      lower.includes('इमरजेंसी') ||
      lower.includes('জরুরি')
    ) {
      text = "Emergency trigger detected! Opening immediate 🚨 Emergency Assistance window. Connecting to 108 emergency call options and emergency medical card.";
      actions = [
        { label: '🚨 Open Emergency Modal', action: 'emergency' }
      ];
    } else if (
      lower.includes('appointment') || 
      lower.includes('doctor') || 
      lower.includes('kab hai') || 
      lower.includes('अपॉइंटमेंट') ||
      lower.includes('অ্যাপয়েন্টমেন্ট')
    ) {
      text = "Your next scheduled appointment is with Dr. Ananya Sen (Cardiologist) on 22 August at 10:30 AM at SCB Medical College. Your current estimated wait queue is #7 in line.";
      actions = [
        { label: '📅 View All Appointments', action: 'view_appointments' }
      ];
    } else if (
      lower.includes('medicine') || 
      lower.includes('dawa') || 
      lower.includes('tablet') || 
      lower.includes('दवा') ||
      lower.includes('ওষুধ')
    ) {
      text = "Your next scheduled medication is Metformin SR 500 mg & Atorvastatin 10 mg scheduled for 08:00 PM tonight. Would you like to mark it as taken?";
      actions = [
        { label: '✓ Mark Evening Dose Taken', action: 'mark_taken' },
        { label: '💊 View Medicine List', action: 'view_medicines' }
      ];
    } else if (
      lower.includes('claim') || 
      lower.includes('insurance') || 
      lower.includes('ayushman') || 
      lower.includes('बीमा')
    ) {
      text = "Your PM-JAY Ayushman Card policy has ₹3,80,000 remaining coverage out of ₹5,00,000. Your recent diagnostic claim #CLM-2026-8942 for ₹14,500 is currently 'Under Review'.";
      actions = [
        { label: '💳 Open Insurance Hub', action: 'view_insurance' }
      ];
    } else if (
      lower.includes('bill') || 
      lower.includes('cost') || 
      lower.includes('charge') || 
      lower.includes('बिल')
    ) {
      text = "In your uploaded Sun Hospital bill, SASHTYA Transparency audit found 1 discrepancy: Nursing Care charge shows ₹3,400 billed vs ₹2,400 calculated. This charge may require verification.";
      actions = [
        { label: '🧾 Review Bill Calculator', action: 'view_bills' }
      ];
    } else {
      text = `I can help you navigate SASHTYA! You can ask me: "When is my next medicine?", "Find nearby hospital", "Check my insurance claim", or "Show my emergency card".`;
      actions = [
        { label: '💊 Check Medicines', action: 'medicine' },
        { label: '📄 View Health Records', action: 'records' }
      ];
    }

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: actions
    };
  }

  static speakText(text: string, lang: string = 'en-US'): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  }
}
