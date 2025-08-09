INSERT INTO document_templates (name, category, variables, body, output_type) VALUES 
('Retainer Agreement - Criminal', 'Criminal', '["client_name", "case_description", "retainer_amount", "attorney_name", "date"]', 'RETAINER AGREEMENT

This Retainer Agreement is entered into on {{date}} between {{attorney_name}} ("Attorney") and {{client_name}} ("Client").

SCOPE OF REPRESENTATION:
Attorney agrees to represent Client in the matter of {{case_description}}.

RETAINER FEE:
Client agrees to pay a retainer fee of ${{retainer_amount}} upon execution of this agreement.

TERMS AND CONDITIONS:
1. This retainer fee is earned upon receipt and is non-refundable.
2. Attorney will provide zealous representation within the bounds of the law.
3. Client agrees to cooperate fully with Attorney in the defense of this matter.

CLIENT ACKNOWLEDGMENT:
By signing below, Client acknowledges that they have read and understood this agreement.

_________________________                    _________________________
{{client_name}}                              {{attorney_name}}
Client                                       Attorney

Date: {{date}}', 'docx'),

('Initial Demand Letter - Personal Injury', 'Personal Injury', '["client_name", "defendant_name", "incident_date", "incident_description", "demand_amount", "attorney_name", "date"]', 'DEMAND FOR SETTLEMENT

TO: {{defendant_name}}

DATE: {{date}}

RE: {{client_name}} - Incident of {{incident_date}}

Dear Sir or Madam:

Our office represents {{client_name}} in connection with the incident that occurred on {{incident_date}}.

FACTS:
{{incident_description}}

INJURIES AND DAMAGES:
As a result of this incident, our client sustained significant injuries and damages.

DEMAND:
We hereby demand the sum of ${{demand_amount}} in settlement of this claim.

Please contact our office within thirty (30) days to discuss resolution of this matter.

Sincerely,

{{attorney_name}}
Attorney for {{client_name}}', 'docx'),

('SSD Appeal Letter', 'SSD', '["client_name", "claim_number", "decision_date", "attorney_name", "date"]', 'NOTICE OF APPEAL

TO: Social Security Administration

DATE: {{date}}

RE: {{client_name}}
    Claim Number: {{claim_number}}
    Decision Date: {{decision_date}}

Dear Hearing Officer:

This letter serves as formal notice that {{client_name}} hereby appeals the unfavorable decision issued on {{decision_date}} regarding their application for Social Security Disability benefits.

We respectfully request that this matter be scheduled for a hearing before an Administrative Law Judge.

Please send all correspondence regarding this matter to the undersigned.

Sincerely,

{{attorney_name}}
Attorney for {{client_name}}', 'docx'),

('Motion to Continue', 'Motions', '["case_name", "case_number", "court_name", "current_date", "reason", "attorney_name", "proposed_date"]', 'IN THE {{court_name}}

{{case_name}}                    Case No. {{case_number}}

MOTION TO CONTINUE

TO THE HONORABLE COURT:

NOW COMES {{attorney_name}}, attorney for Defendant, and respectfully moves this Court to continue the trial currently scheduled for {{current_date}} for the following reasons:

{{reason}}

WHEREFORE, Defendant respectfully requests that this Court grant this Motion to Continue and reschedule the trial to {{proposed_date}} or such other date as may be convenient to the Court.

Respectfully submitted,

{{attorney_name}}
Attorney for Defendant', 'docx'),

('Client Intake Questionnaire', 'Forms', '["client_name", "incident_date", "attorney_name"]', 'CLIENT INTAKE QUESTIONNAIRE

Client Name: {{client_name}}
Date: {{incident_date}}
Attorney: {{attorney_name}}

PERSONAL INFORMATION:
Name: ____________________________
Address: __________________________
Phone: ____________________________
Email: ____________________________
Date of Birth: ____________________
Social Security Number: ____________

CASE INFORMATION:
Date of Incident: {{incident_date}}
Location of Incident: ______________
Description of Incident:
___________________________________
___________________________________

INJURIES:
Describe your injuries:
___________________________________
___________________________________

Medical treatment received:
___________________________________
___________________________________

Current medical providers:
___________________________________
___________________________________

Please complete and return this form at your earliest convenience.

{{attorney_name}}', 'docx');