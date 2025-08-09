import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { 
  User, 
  FileText, 
  AlertTriangle, 
  MapPin,
  Save,
  ArrowRight,
  Check
} from 'lucide-react';

interface IntakeFormData {
  // Client Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  preferred_contact_method: string;
  
  // Case Info
  practice_area: string;
  case_description: string;
  incident_date: string;
  urgency_level: string;
  
  // Criminal Specific
  criminal_charges?: string;
  arrest_date?: string;
  jurisdiction?: string;
  
  // Personal Injury Specific
  pi_incident_type?: string;
  pi_injuries?: string;
  pi_insurance_company?: string;
  
  // SSD Specific
  ssd_disability_type?: string;
  ssd_work_date?: string;
  ssd_medical_providers?: string;
}

export default function IntakeForm() {
  const [searchParams] = useSearchParams();
  const practiceArea = searchParams.get('practice_area') || '';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<IntakeFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
    emergency_contact: {
      name: '',
      relationship: '',
      phone: '',
    },
    preferred_contact_method: 'Email',
    practice_area: practiceArea,
    case_description: '',
    incident_date: '',
    urgency_level: 'Medium',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4;

  const steps = [
    { id: 1, name: 'Personal Information', icon: User },
    { id: 2, name: 'Contact & Address', icon: MapPin },
    { id: 3, name: 'Case Details', icon: FileText },
    { id: 4, name: 'Review & Submit', icon: Check },
  ];

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (step === 2) {
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
      if (!formData.address.city.trim()) newErrors.city = 'City is required';
      if (!formData.address.state.trim()) newErrors.state = 'State is required';
      if (!formData.address.zip.trim()) newErrors.zip = 'ZIP code is required';
    }

    if (step === 3) {
      if (!formData.practice_area) newErrors.practice_area = 'Practice area is required';
      if (!formData.case_description.trim()) newErrors.case_description = 'Case description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // Submit intake form (no auth required)
      const response = await fetch('/api/intakes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit intake form');
      }

      setSubmitted(true);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to submit intake form. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Intake Form Submitted Successfully
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We have received your intake form and will review it promptly.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Attorney will review your case within 24-48 hours</li>
              <li>• We'll contact you to schedule a consultation</li>
              <li>• You'll receive client portal access via email</li>
              <li>• Initial consultation will be scheduled if appropriate</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            For urgent matters, please call: <strong>(555) 123-4567</strong>
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Intake Form</h1>
          <p className="mt-2 text-gray-600">
            Please provide the following information to help us understand your case
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'bg-blue-500 border-blue-500 text-white' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-20 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="text-center">
                <p className={`text-xs font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.first_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.last_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Contact & Address Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Contact Method
                  </label>
                  <select
                    value={formData.preferred_contact_method}
                    onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, street: e.target.value }
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.street ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.street && (
                    <p className="mt-1 text-sm text-red-600">{errors.street}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, city: e.target.value }
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, state: e.target.value }
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.state ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.address.zip}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, zip: e.target.value }
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.zip ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.zip && (
                    <p className="mt-1 text-sm text-red-600">{errors.zip}</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact.name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergency_contact: { ...formData.emergency_contact, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact.relationship}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergency_contact: { ...formData.emergency_contact, relationship: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_contact.phone}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergency_contact: { ...formData.emergency_contact, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Case Details</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Practice Area *
                  </label>
                  <select
                    value={formData.practice_area}
                    onChange={(e) => setFormData({ ...formData, practice_area: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.practice_area ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select practice area...</option>
                    <option value="Criminal">Criminal Defense</option>
                    <option value="PersonalInjury">Personal Injury</option>
                    <option value="SSD">Social Security Disability</option>
                  </select>
                  {errors.practice_area && (
                    <p className="mt-1 text-sm text-red-600">{errors.practice_area}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Description *
                  </label>
                  <textarea
                    value={formData.case_description}
                    onChange={(e) => setFormData({ ...formData, case_description: e.target.value })}
                    rows={4}
                    placeholder="Please provide a detailed description of your case..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.case_description ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.case_description && (
                    <p className="mt-1 text-sm text-red-600">{errors.case_description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incident Date
                    </label>
                    <input
                      type="date"
                      value={formData.incident_date}
                      onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={formData.urgency_level}
                      onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low - General consultation</option>
                      <option value="Medium">Medium - Standard timeline</option>
                      <option value="High">High - Time sensitive</option>
                      <option value="Urgent">Urgent - Immediate attention needed</option>
                    </select>
                  </div>
                </div>

                {/* Practice area specific fields */}
                {formData.practice_area === 'Criminal' && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-3">Criminal Case Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-red-800 mb-1">
                          Charges (if known)
                        </label>
                        <input
                          type="text"
                          value={formData.criminal_charges || ''}
                          onChange={(e) => setFormData({ ...formData, criminal_charges: e.target.value })}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-red-800 mb-1">
                          Arrest Date
                        </label>
                        <input
                          type="date"
                          value={formData.arrest_date || ''}
                          onChange={(e) => setFormData({ ...formData, arrest_date: e.target.value })}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-red-800 mb-1">
                          Jurisdiction/Court
                        </label>
                        <input
                          type="text"
                          value={formData.jurisdiction || ''}
                          onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.practice_area === 'PersonalInjury' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Personal Injury Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Type of Incident
                        </label>
                        <select
                          value={formData.pi_incident_type || ''}
                          onChange={(e) => setFormData({ ...formData, pi_incident_type: e.target.value })}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select incident type...</option>
                          <option value="Motor Vehicle Accident">Motor Vehicle Accident</option>
                          <option value="Slip and Fall">Slip and Fall</option>
                          <option value="Medical Malpractice">Medical Malpractice</option>
                          <option value="Product Liability">Product Liability</option>
                          <option value="Workplace Injury">Workplace Injury</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Insurance Company (if known)
                        </label>
                        <input
                          type="text"
                          value={formData.pi_insurance_company || ''}
                          onChange={(e) => setFormData({ ...formData, pi_insurance_company: e.target.value })}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Injuries Sustained
                        </label>
                        <textarea
                          value={formData.pi_injuries || ''}
                          onChange={(e) => setFormData({ ...formData, pi_injuries: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.practice_area === 'SSD' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-3">Social Security Disability Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-1">
                          Type of Disability
                        </label>
                        <select
                          value={formData.ssd_disability_type || ''}
                          onChange={(e) => setFormData({ ...formData, ssd_disability_type: e.target.value })}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select disability type...</option>
                          <option value="Physical">Physical Disability</option>
                          <option value="Mental">Mental Health Condition</option>
                          <option value="Both">Both Physical and Mental</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-1">
                          Last Date Worked
                        </label>
                        <input
                          type="date"
                          value={formData.ssd_work_date || ''}
                          onChange={(e) => setFormData({ ...formData, ssd_work_date: e.target.value })}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-green-800 mb-1">
                          Medical Providers
                        </label>
                        <textarea
                          value={formData.ssd_medical_providers || ''}
                          onChange={(e) => setFormData({ ...formData, ssd_medical_providers: e.target.value })}
                          rows={3}
                          placeholder="List your doctors, hospitals, and other medical providers..."
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <Check className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Please review your information:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Personal Information</h4>
                    <p><strong>Name:</strong> {formData.first_name} {formData.last_name}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                    {formData.date_of_birth && (
                      <p><strong>Date of Birth:</strong> {new Date(formData.date_of_birth).toLocaleDateString()}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Address</h4>
                    <p>{formData.address.street}</p>
                    <p>{formData.address.city}, {formData.address.state} {formData.address.zip}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Case Information</h4>
                    <p><strong>Practice Area:</strong> {formData.practice_area}</p>
                    <p><strong>Urgency:</strong> {formData.urgency_level}</p>
                    {formData.incident_date && (
                      <p><strong>Incident Date:</strong> {new Date(formData.incident_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Case Description</h4>
                    <p className="text-gray-600">{formData.case_description}</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">What happens next?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your intake will be reviewed by our team</li>
                        <li>We'll contact you within 24-48 hours</li>
                        <li>You'll receive access to your client portal</li>
                        <li>We'll schedule an initial consultation if appropriate</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                currentStep === 1
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Submit Intake
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
