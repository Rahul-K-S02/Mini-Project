// AI-Powered Symptom Analyzer
// This service analyzes patient symptoms and recommends appropriate doctors based on symptom patterns

const symptomDatabase = {
  // Cardiology symptoms
  cardiology: {
    keywords: ['chest pain', 'heart palpitations', 'shortness of breath', 'chest tightness', 
               'dizziness', 'irregular heartbeat', 'high blood pressure', 'cardiac', 
               'heart attack', 'coronary', 'arrhythmia', 'angina', 'blood pressure', 'hypertension', 
               'heartburn', 'chest discomfort', 'racing heart', 'weakness', 'fatigue', 'swelling legs'],
    urgencyLevels: {
      'chest pain': 'urgent',
      'heart attack': 'emergency',
      'irregular heartbeat': 'high',
      'shortness of breath': 'high',
      'high blood pressure': 'medium'
    },
    synonyms: ['cardiac', 'cardiovascular', 'heart', 'circulatory', 'blood pressure']
  },

  // Dermatology symptoms
  dermatology: {
    keywords: ['rash', 'itching', 'skin lesions', 'acne', 'psoriasis', 'eczema', 'dermatitis', 
               'hives', 'blisters', 'skin discoloration', 'moles', 'skin cancer', 'alopecia', 
               'hair loss', 'fungal infection', 'skin infection', 'warts', 'bumps', 'irritation'],
    urgencyLevels: {
      'skin cancer': 'urgent',
      'severe rash': 'high',
      'infection': 'high'
    },
    synonyms: ['skin', 'dermal', 'cutaneous', 'hair', 'nails']
  },

  // Neurology symptoms
  neurology: {
    keywords: ['headache', 'migraine', 'seizures', 'epilepsy', 'stroke', 'memory loss', 
               'confusion', 'dizziness', 'vertigo', 'nerve pain', 'numbness', 'tingling', 
               'weakness', 'paralysis', 'tremors', 'parkinson', 'alzheimer', 'brain injury', 
               'concussion', 'neurological'],
    urgencyLevels: {
      'stroke': 'emergency',
      'seizures': 'emergency',
      'severe headache': 'urgent',
      'memory loss': 'high'
    },
    synonyms: ['brain', 'neurological', 'nerve', 'cognitive', 'mental']
  },

  // Orthopedics symptoms
  orthopedics: {
    keywords: ['joint pain', 'fracture', 'broken bone', 'arthritis', 'knee pain', 'back pain', 
               'shoulder pain', 'hip pain', 'sprain', 'strain', 'spine', 'sciatica', 
               'disc herniation', 'tendonitis', 'bursitis', 'osteoporosis', 'bone fracture', 
               'joint stiffness', 'limb pain'],
    urgencyLevels: {
      'fracture': 'urgent',
      'broken bone': 'urgent',
      'severe back pain': 'high'
    },
    synonyms: ['bone', 'joint', 'skeletal', 'spine', 'orthopedic', 'musculoskeletal']
  },

  // Pediatrics symptoms
  pediatrics: {
    keywords: ['fever', 'cough', 'cold', 'vaccination', 'growth', 'development', 'pediatric', 
               'child', 'baby', 'infant', 'toddler', 'teenager', 'adolescent', 'juvenile', 
               'respiratory infection', 'ear infection', 'immunization', 'childhood illness', 
               'ADHD', 'autism'],
    urgencyLevels: {
      'high fever': 'urgent',
      'child emergency': 'emergency',
      'severe illness': 'high'
    },
    synonyms: ['child', 'pediatric', 'infant', 'baby', 'juvenile']
  },

  // Psychiatry symptoms
  psychiatry: {
    keywords: ['depression', 'anxiety', 'stress', 'panic', 'mental health', 'psychiatric', 
               'bipolar', 'schizophrenia', 'psychosis', 'suicidal', 'eating disorder', 'PTSD', 
               'obsessive compulsive', 'OCD', 'mood swings', 'behavioral issues', 'cognitive therapy', 
               'mental disorder', 'psychological'],
    urgencyLevels: {
      'suicidal': 'emergency',
      'psychosis': 'urgent',
      'severe depression': 'high'
    },
    synonyms: ['mental', 'psychological', 'psychiatric', 'cognitive', 'behavioral']
  },

  // General Medicine symptoms
  general_medicine: {
    keywords: ['fever', 'flu', 'cough', 'cold', 'nausea', 'vomiting', 'diarrhea', 'constipation', 
               'fatigue', 'weakness', 'general illness', 'infection', 'pain', 'discomfort', 
               'general consultation', 'health checkup', 'screening', 'preventive care'],
    urgencyLevels: {
      'high fever': 'high',
      'severe pain': 'high'
    },
    synonyms: ['general', 'primary', 'family', 'preventive', 'checkup']
  },

  // Gynecology symptoms
  gynecology: {
    keywords: ['menstrual', 'pregnancy', 'miscarriage', 'ovarian', 'uterine', 'fertility', 
               'menopause', 'vaginal', 'pelvic pain', 'breast', 'pap smear', 'contraception', 
               'gynecological', 'prenatal', 'postnatal', 'maternal', 'reproductive'],
    urgencyLevels: {
      'pregnancy complications': 'urgent',
      'severe pain': 'high'
    },
    synonyms: ['women', 'female', 'reproductive', 'gynecological', 'maternal']
  },

  // Ophthalmology symptoms
  ophthalmology: {
    keywords: ['eye pain', 'vision loss', 'blurred vision', 'eye infection', 'cataracts', 
               'glaucoma', 'retinal', 'conjunctivitis', 'eye injury', 'dry eyes', 'floaters', 
               'light sensitivity', 'red eyes', 'eye surgery', 'refractive', 'diabetic retinopathy'],
    urgencyLevels: {
      'vision loss': 'urgent',
      'eye injury': 'urgent',
      'severe eye pain': 'high'
    },
    synonyms: ['eye', 'vision', 'ocular', 'retinal', 'opthalmic']
  },

  // ENT symptoms
  ent: {
    keywords: ['ear pain', 'hearing loss', 'ear infection', 'nasal', 'sinus', 'sore throat', 
               'tonsillitis', 'laryngitis', 'hoarseness', 'voice problems', 'balance issues', 
               'vertigo', 'ear discharge', 'nose bleed', 'snoring', 'sleep apnea', 
               'audiometry', 'hearing aid', 'tinnitus'],
    urgencyLevels: {
      'hearing loss': 'urgent',
      'severe ear pain': 'high',
      'breathing difficulty': 'urgent'
    },
    synonyms: ['ear', 'nose', 'throat', 'hearing', 'nasal', 'sinus']
  }
};

// Analyze symptoms and determine urgency and recommended specializations
export const analyzeSymptoms = (symptoms) => {
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return {
      error: 'No symptoms provided',
      recommendedSpecializations: [],
      urgencyLevel: 'low',
      confidence: 0
    };
  }

  // Convert symptoms to lowercase for matching
  const symptomText = symptoms.join(' ').toLowerCase();
  
  // Score each specialization based on symptom matches
  const scores = {};
  const urgencyLevels = [];
  
  Object.keys(symptomDatabase).forEach(specialization => {
    const data = symptomDatabase[specialization];
    let score = 0;
    
    // Check for keyword matches
    data.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (symptomText.includes(keywordLower)) {
        score += 1;
        
        // Check for urgency levels
        if (data.urgencyLevels[keyword]) {
          urgencyLevels.push({
            keyword,
            urgency: data.urgencyLevels[keyword],
            specialization
          });
        }
      }
    });
    
    // Check for synonym matches
    data.synonyms.forEach(synonym => {
      if (symptomText.includes(synonym)) {
        score += 0.5;
      }
    });
    
    if (score > 0) {
      scores[specialization] = score;
    }
  });

  // Sort by score and get top recommendations
  const sortedSpecializations = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // Top 3 specializations

  // Determine overall urgency level
  let overallUrgency = 'low';
  if (urgencyLevels.length > 0) {
    const urgencies = urgencyLevels.map(u => u.urgency);
    if (urgencies.includes('emergency')) {
      overallUrgency = 'emergency';
    } else if (urgencies.includes('urgent')) {
      overallUrgency = 'urgent';
    } else if (urgencies.includes('high')) {
      overallUrgency = 'high';
    } else if (urgencies.includes('medium')) {
      overallUrgency = 'medium';
    }
  }

  // Calculate confidence based on score distribution
  const topScore = sortedSpecializations.length > 0 ? sortedSpecializations[0][1] : 0;
  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
  const confidence = totalScore > 0 ? (topScore / totalScore) * 100 : 0;

  return {
    symptoms,
    recommendedSpecializations: sortedSpecializations.map(([spec, score]) => ({
      specialization: spec,
      confidence: (score / (scores[spec] || 1)) * 100,
      score
    })),
    urgencyLevel: overallUrgency,
    confidence: Math.round(confidence),
    urgencyDetails: urgencyLevels,
    analysis: {
      totalSymptoms: symptoms.length,
      matchedCategories: sortedSpecializations.length,
      topRecommendation: sortedSpecializations.length > 0 ? sortedSpecializations[0][0] : null
    }
  };
};

// Get symptoms by category (for UI dropdown/autocomplete)
export const getSymptomsByCategory = (category) => {
  if (!category || !symptomDatabase[category.toLowerCase()]) {
    return [];
  }
  return symptomDatabase[category.toLowerCase()].keywords;
};

// Get all symptoms for autocomplete
export const getAllSymptoms = () => {
  const allSymptoms = [];
  Object.values(symptomDatabase).forEach(data => {
    data.keywords.forEach(keyword => {
      if (!allSymptoms.includes(keyword)) {
        allSymptoms.push(keyword);
      }
    });
  });
  return allSymptoms.sort();
};

// Get symptoms suggestions based on partial input
export const getSymptomSuggestions = (query) => {
  const allSymptoms = getAllSymptoms();
  const queryLower = query.toLowerCase();
  
  return allSymptoms.filter(symptom => 
    symptom.toLowerCase().includes(queryLower)
  ).slice(0, 10); // Return top 10 matches
};

// Determine if symptoms require immediate medical attention
export const isEmergency = (analysisResult) => {
  return analysisResult.urgencyLevel === 'emergency' || 
         analysisResult.urgencyLevel === 'urgent';
};

// Get AI-generated health recommendation
export const generateHealthRecommendation = (analysisResult, patientAge, patientGender) => {
  const { recommendedSpecializations, urgencyLevel } = analysisResult;
  
  let recommendation = '';
  let actionPlan = [];
  
  if (urgencyLevel === 'emergency') {
    recommendation = 'URGENT: Seek immediate medical attention at the nearest emergency room or call emergency services.';
    actionPlan = [
      'Call emergency services (911/999) immediately',
      'Do not delay seeking medical care',
      'If possible, have someone accompany you',
      'Bring insurance card and identification'
    ];
  } else if (urgencyLevel === 'urgent') {
    recommendation = 'Urgent care recommended. Please seek medical attention within 24 hours.';
    actionPlan = [
      'Contact a healthcare provider today',
      'Consider visiting urgent care if your primary care provider is unavailable',
      'Monitor symptoms closely',
      'Rest and stay hydrated'
    ];
  } else if (urgencyLevel === 'high') {
    recommendation = 'Schedule an appointment with a healthcare provider as soon as possible (within 48 hours).';
    actionPlan = [
      'Contact your healthcare provider within 48 hours',
      'Monitor symptoms for any worsening',
      'Keep track of your symptoms',
      'Get adequate rest'
    ];
  } else if (recommendedSpecializations.length > 0) {
    const topSpecialization = recommendedSpecializations[0].specialization;
    recommendation = `Based on your symptoms, we recommend consulting a ${topSpecialization} specialist.`;
    actionPlan = [
      'Schedule an appointment with recommended specialist',
      'Prepare a list of your symptoms and duration',
      'Note down any medications you are currently taking',
      'Keep a symptom diary'
    ];
  } else {
    recommendation = 'Based on your symptoms, we recommend consulting a general medicine practitioner.';
    actionPlan = [
      'Schedule a general consultation',
      'Maintain a healthy lifestyle',
      'Monitor your symptoms',
      'Follow up if symptoms persist'
    ];
  }
  
  return {
    recommendation,
    actionPlan,
    urgencyLevel,
    bestMatch: recommendedSpecializations.length > 0 ? recommendedSpecializations[0] : null,
    additionalNotes: patientAge > 65 ? 'Consider discussing with a geriatric specialist due to age factor.' : ''
  };
};

export default {
  analyzeSymptoms,
  getSymptomsByCategory,
  getAllSymptoms,
  getSymptomSuggestions,
  isEmergency,
  generateHealthRecommendation
};

