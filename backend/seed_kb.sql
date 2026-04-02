-- ============================================================
-- QAA Knowledge Base Seed Data
-- Categories + FAQ Entries (English & Arabic)
-- ============================================================

-- 1. Categories
INSERT INTO kb_categories (id, name_en, name_ar, description_en, description_ar, channel, sort_order) VALUES
('10000000-0000-0000-0000-000000000001', 'About the Academy', 'عن الأكاديمية', 'General information about QAA', 'معلومات عامة عن الأكاديمية', 'whatsapp_registration', 1),
('10000000-0000-0000-0000-000000000002', 'Academic Programs', 'البرامج الأكاديمية', 'Programs and courses offered', 'البرامج والدورات المقدمة', 'whatsapp_registration', 2),
('10000000-0000-0000-0000-000000000003', 'Foundation & Language', 'البرامج التأسيسية واللغة', 'Foundation and language programs', 'البرامج التأسيسية وبرامج اللغة', 'whatsapp_registration', 3),
('10000000-0000-0000-0000-000000000004', 'Facilities & Fleet', 'المرافق والأسطول', 'Campus facilities and training fleet', 'مرافق الحرم الجامعي وأسطول التدريب', 'whatsapp_registration', 4),
('10000000-0000-0000-0000-000000000005', 'Admission & Registration', 'القبول والتسجيل', 'Admission requirements and process', 'متطلبات وإجراءات القبول', 'whatsapp_registration', 5),
('10000000-0000-0000-0000-000000000006', 'Faculty & Careers', 'هيئة التدريس والتوظيف', 'Teaching staff and career opportunities', 'الكادر التعليمي وفرص العمل', 'whatsapp_registration', 6),
('10000000-0000-0000-0000-000000000007', 'Contact Information', 'معلومات الاتصال', 'How to reach QAA', 'كيفية التواصل مع الأكاديمية', 'whatsapp_registration', 7),
('10000000-0000-0000-0000-000000000008', 'Qatar Vision 2030', 'رؤية قطر 2030', 'Strategic alignment with national vision', 'التوافق الاستراتيجي مع الرؤية الوطنية', 'whatsapp_registration', 8);

-- 2. FAQ Entries

-- === ABOUT THE ACADEMY ===
INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000001',
 'What is Qatar Aeronautical Academy?',
 'ما هي أكاديمية قطر للطيران؟',
 'Qatar Aeronautical Academy (QAA) is the Gulf region''s leading provider of aviation training. Operating under the motto "Excellence Becomes Reality", QAA offers full-time approved courses for pilots, aircraft maintenance engineers, air traffic controllers, meteorologists, airport operations personnel, and flight dispatchers.',
 'أكاديمية قطر للطيران هي المزود الرائد للتدريب على الطيران في منطقة الخليج. تعمل تحت شعار "التميز يصبح حقيقة"، وتقدم دورات معتمدة بدوام كامل للطيارين ومهندسي صيانة الطائرات ومراقبي الحركة الجوية وخبراء الأرصاد الجوية وموظفي عمليات المطار ومرسلي الرحلات.',
 ARRAY['QAA', 'about', 'academy', 'overview', 'aviation', 'training'],
 ARRAY['الأكاديمية', 'عن', 'طيران', 'تدريب'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000001',
 'When was QAA founded?',
 'متى تأسست أكاديمية قطر للطيران؟',
 'QAA was originally established in 1977 as the Civil Aviation College of the Gulf States — a regional cooperative venture. In 1996, it was renamed Qatar Aeronautical College to reflect its specialized focus and alignment with Qatar''s national development goals.',
 'تأسست الأكاديمية في الأصل عام 1977 باسم كلية الطيران المدني لدول الخليج. في عام 1996، أعيدت تسميتها إلى كلية قطر للطيران لتعكس تخصصها وتوافقها مع أهداف التنمية الوطنية لقطر.',
 ARRAY['founded', 'history', '1977', '1996', 'established', 'when'],
 ARRAY['تأسست', 'تاريخ', 'متى'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000001',
 'Who is the Director General of QAA?',
 'من هو المدير العام لأكاديمية قطر للطيران؟',
 'The Director General of Qatar Aeronautical Academy is Sheikh Jabor Bin Hamad M. Al-Thani. His strategic mandate focuses on delivering outstanding standards in advanced aviation disciplines and transforming the culture of aviation education in Qatar.',
 'المدير العام لأكاديمية قطر للطيران هو الشيخ جبر بن حمد آل ثاني. يركز على تقديم معايير متميزة في تخصصات الطيران المتقدمة وتحويل ثقافة تعليم الطيران في قطر.',
 ARRAY['director', 'leadership', 'head', 'manager', 'al-thani'],
 ARRAY['المدير', 'القيادة', 'رئيس'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000001',
 'What is the vision and mission of QAA?',
 'ما هي رؤية ورسالة أكاديمية قطر للطيران؟',
 E'Vision: Prepare qualified cadres according to the highest international quality standards to achieve leadership in civil aviation.\n\nMission: To prepare a generation of leaders through improved training opportunities and the latest training systems.\n\nValues: Integrity, loyalty, transparency, non-discrimination, and teamwork.',
 E'الرؤية: إعداد كوادر مؤهلة وفق أعلى معايير الجودة الدولية لتحقيق الريادة في الطيران المدني.\n\nالرسالة: إعداد جيل من القادة من خلال فرص تدريب محسنة وأحدث أنظمة التدريب.\n\nالقيم: النزاهة، الولاء، الشفافية، عدم التمييز، والعمل الجماعي.',
 ARRAY['vision', 'mission', 'values', 'goal', 'purpose'],
 ARRAY['رؤية', 'رسالة', 'قيم', 'هدف'],
 'whatsapp_registration', 'manual_entry');

-- === ACADEMIC PROGRAMS ===
INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002',
 'What programs does QAA offer?',
 'ما هي البرامج التي تقدمها الأكاديمية؟',
 E'QAA offers programs in five main areas:\n\n1. Flight Training — Multi-Crew Pilot License (MPL) and Commercial Pilot License (CPL)\n2. Aircraft Maintenance Engineering — EASA Part 147 certified (Category B1 Mechanical & B2 Avionics)\n3. Air Traffic Control (ATC) — ICAO-standard certified controllers\n4. Meteorology — Specialized aviation weather forecasting\n5. Flight Dispatch & Airport Operations — ICAO Doc 10106 compliant\n\nAdditionally: Foundation Programs, ICAO Short Courses, and English Language Proficiency (IELTS).',
 E'تقدم الأكاديمية برامج في خمسة مجالات رئيسية:\n\n1. التدريب على الطيران — رخصة طيار متعدد الطاقم (MPL) ورخصة طيار تجاري (CPL)\n2. هندسة صيانة الطائرات — معتمدة وفق EASA الجزء 147\n3. مراقبة الحركة الجوية — وفق معايير ICAO\n4. الأرصاد الجوية — التنبؤ الجوي المتخصص للطيران\n5. إرسال الرحلات وعمليات المطار — وفق وثيقة ICAO 10106',
 ARRAY['programs', 'courses', 'offered', 'study', 'training', 'list', 'all'],
 ARRAY['برامج', 'دورات', 'دراسة', 'تدريب'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002',
 'Tell me about the pilot training program',
 'أخبرني عن برنامج تدريب الطيارين',
 E'QAA offers two pilot training pathways:\n\nMulti-Crew Pilot License (MPL):\n- Competency-based training for multi-crew airline cockpits\n- Focuses on human factors, communication, and system-management\n- Prepares pilots specifically for the Airbus A320\n\nCommercial Pilot License (CPL):\n- Traditional pathway to commercial pilot certification\n\nTraining uses modern fleet: Diamond DA40 (single-engine), DA42 (twin-engine), Piper PA28/PA34, and an EASA-certified A320 FFTX simulator.',
 E'تقدم الأكاديمية مسارين لتدريب الطيارين:\n\nرخصة طيار متعدد الطاقم (MPL):\n- تدريب قائم على الكفاءة لقمرة القيادة متعددة الطاقم\n- يركز على العوامل البشرية والاتصال وإدارة الأنظمة\n- يعد الطيارين خصيصاً لطائرة إيرباص A320\n\nرخصة طيار تجاري (CPL):\n- المسار التقليدي للحصول على شهادة طيار تجاري',
 ARRAY['pilot', 'MPL', 'CPL', 'flying', 'flight', 'training', 'A320', 'license'],
 ARRAY['طيار', 'طيران', 'رخصة', 'تدريب'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002',
 'Tell me about aircraft maintenance engineering',
 'أخبرني عن هندسة صيانة الطائرات',
 E'The Aircraft Maintenance Engineering (AME) program:\n\n- Certified under EASA Part 147 and QCAA regulations\n- Two specializations:\n  - Category B1 — Mechanical\n  - Category B2 — Avionics\n- Hands-on training on academy fleet: Diamond DA40, DA42, Piper PA28/PA34\n- Integrated with QAA''s own MRO department (EASA & FAA approved)\n- Seamless transition from classroom to live aircraft maintenance',
 E'برنامج هندسة صيانة الطائرات (AME):\n\n- معتمد وفق EASA الجزء 147 ولوائح QCAA\n- تخصصان:\n  - الفئة B1 — ميكانيكي\n  - الفئة B2 — إلكترونيات الطيران\n- تدريب عملي على أسطول الأكاديمية\n- متكامل مع قسم MRO الخاص بالأكاديمية (معتمد من EASA و FAA)',
 ARRAY['maintenance', 'engineering', 'AME', 'EASA', 'mechanical', 'avionics', 'B1', 'B2', 'MRO'],
 ARRAY['صيانة', 'هندسة', 'ميكانيكي', 'إلكترونيات'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002',
 'Tell me about the Air Traffic Control program',
 'أخبرني عن برنامج مراقبة الحركة الجوية',
 E'The Air Traffic Control (ATC) program:\n\n- Trains students in managing aircraft movements on the ground and in the air\n- Uses advanced surveillance and communication technologies\n- Designed to meet ICAO standards\n- Graduates are qualified to operate within any international airspace framework\n- Covers radar systems, flight path management, and emergency procedures',
 E'برنامج مراقبة الحركة الجوية (ATC):\n\n- يدرب الطلاب على إدارة حركة الطائرات على الأرض وفي الجو\n- يستخدم تقنيات مراقبة واتصال متقدمة\n- مصمم وفق معايير ICAO\n- يؤهل الخريجين للعمل في أي إطار مجال جوي دولي',
 ARRAY['ATC', 'air traffic', 'control', 'radar', 'airspace', 'controller'],
 ARRAY['مراقبة', 'حركة جوية', 'رادار'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002',
 'Tell me about the Meteorology program',
 'أخبرني عن برنامج الأرصاد الجوية',
 E'The Meteorology program:\n\n- Addresses the unique climatic challenges of the Gulf region\n- Covers: thermodynamics, atmospheric physics, satellite imagery, and radar\n- Provides accurate weather forecasting and data analysis for flight planning and safety\n- Graduates serve airlines and airport operators with high-fidelity weather data',
 E'برنامج الأرصاد الجوية:\n\n- يعالج التحديات المناخية الفريدة لمنطقة الخليج\n- يشمل: الديناميكا الحرارية، فيزياء الغلاف الجوي، صور الأقمار الصناعية، والرادار\n- يوفر تنبؤات جوية دقيقة وتحليل بيانات لتخطيط الرحلات والسلامة',
 ARRAY['meteorology', 'weather', 'forecast', 'climate', 'atmosphere'],
 ARRAY['أرصاد', 'طقس', 'مناخ'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002',
 'Tell me about Flight Dispatch and Airport Operations',
 'أخبرني عن إرسال الرحلات وعمليات المطار',
 E'Flight Dispatch:\n- Operates per ICAO Doc 10106 and QCAA regulations\n- Flight dispatchers are the "pilots on the ground"\n- Responsibilities: fuel calculations, weather monitoring, safety compliance\n- Uses Electronic Flight Bags (EFB) and advanced flight planning software\n\nAirport Operations Management:\n- Prepares students for managing large-scale aviation hubs\n- Focused on logistics and safety challenges\n- Aligned with Hamad International Airport standards',
 E'إرسال الرحلات:\n- يعمل وفق وثيقة ICAO 10106 ولوائح QCAA\n- مرسلو الرحلات هم "الطيارون على الأرض"\n- المسؤوليات: حسابات الوقود، مراقبة الطقس، الامتثال للسلامة\n\nإدارة عمليات المطار:\n- يعد الطلاب لإدارة مراكز الطيران الكبرى\n- يركز على التحديات اللوجستية والسلامة',
 ARRAY['dispatch', 'airport', 'operations', 'flight dispatch', 'fuel', 'EFB', 'ground ops'],
 ARRAY['إرسال', 'مطار', 'عمليات', 'وقود'],
 'whatsapp_registration', 'manual_entry');

-- === FOUNDATION & LANGUAGE ===
INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000003',
 'What foundation programs are available?',
 'ما هي البرامج التأسيسية المتاحة؟',
 E'QAA offers foundation programs to bridge the gap for students entering specialized aeronautical training:\n\nTechnical Foundation:\n- Physics (general to aviation-specific)\n- Mathematics tailored for pilot training and maintenance engineering\n- Covers aerodynamics, propulsion systems, and structural mechanics\n\nEnglish Language Training:\n- General English\n- English for Aviation (aviation phraseology)\n- Academic English\n- Prepares students for ICAO Language Proficiency Requirements (LPRs)\n- Instructors hold MA in TESOL, CELTA, or DELTA certifications',
 E'تقدم الأكاديمية برامج تأسيسية:\n\nالأساس التقني:\n- الفيزياء (عامة إلى متخصصة للطيران)\n- الرياضيات المصممة لتدريب الطيارين وهندسة الصيانة\n\nتدريب اللغة الإنجليزية:\n- اللغة الإنجليزية العامة\n- الإنجليزية للطيران\n- الإنجليزية الأكاديمية\n- إعداد لمتطلبات إتقان اللغة وفق ICAO',
 ARRAY['foundation', 'english', 'language', 'physics', 'math', 'IELTS', 'preparation', 'prerequisite'],
 ARRAY['تأسيسي', 'إنجليزي', 'لغة', 'فيزياء', 'رياضيات'],
 'whatsapp_registration', 'manual_entry');

-- === FACILITIES & FLEET ===
INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000004',
 'Where is QAA located?',
 'أين تقع أكاديمية قطر للطيران؟',
 'Qatar Aeronautical Academy is located in the Al Khulaifat Area, Doha, Qatar. The campus is strategically positioned between Doha International Airport and Hamad International Airport, providing an immersive environment where students are exposed to the operational realities of major aviation hubs.',
 'تقع أكاديمية قطر للطيران في منطقة الخليفات، الدوحة، قطر. يقع الحرم الجامعي في موقع استراتيجي بين مطار الدوحة الدولي ومطار حمد الدولي.',
 ARRAY['location', 'where', 'address', 'campus', 'Al Khulaifat', 'Doha'],
 ARRAY['موقع', 'أين', 'عنوان', 'الخليفات', 'الدوحة'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000004',
 'What facilities does the campus have?',
 'ما هي المرافق المتوفرة في الحرم الجامعي؟',
 E'QAA campus facilities include:\n\n- Administration & Departmental Offices\n- Classrooms with latest educational technology\n- Specialized workshops for engineering students\n- Technical library\n- Examination & Testing Centres (IELTS, OET, LINGUASKILLS, academic exams)\n- Student amenities (cafeteria and snack bars)\n- Simulator center with A320 FFTX and other training devices',
 E'تشمل مرافق الحرم الجامعي:\n\n- مكاتب الإدارة والأقسام\n- فصول دراسية بأحدث التقنيات التعليمية\n- ورش متخصصة لطلاب الهندسة\n- مكتبة تقنية\n- مراكز الاختبارات (IELTS، OET، LINGUASKILLS)\n- مرافق الطلاب (كافيتيريا ومقاصف)\n- مركز المحاكاة مع A320 FFTX',
 ARRAY['facilities', 'campus', 'building', 'classroom', 'library', 'workshop', 'cafeteria'],
 ARRAY['مرافق', 'حرم', 'مبنى', 'فصل', 'مكتبة', 'ورشة'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000004',
 'What aircraft does QAA have for training?',
 'ما هي الطائرات المتوفرة للتدريب في الأكاديمية؟',
 E'QAA maintains one of the most modern training fleets in the region (oldest aircraft < 7 years old):\n\n- Diamond DA40 — Single-engine, for initial and instrument flight training\n- Diamond DA42 — Twin-engine, for multi-engine ratings and advanced navigation\n- Piper PA28 — Single-engine, complementary training platform\n- Piper PA34 — Twin-engine, complementary training platform\n\nAll aircraft feature glass cockpits and advanced avionics matching commercial aviation standards. Maintained by QAA''s EASA & FAA approved MRO department.',
 E'تمتلك الأكاديمية أحد أحدث أساطيل التدريب في المنطقة:\n\n- Diamond DA40 — محرك واحد، للتدريب الأولي على الطيران والأجهزة\n- Diamond DA42 — محركان، لتصنيفات المحرك المتعدد والملاحة المتقدمة\n- Piper PA28 — محرك واحد\n- Piper PA34 — محركان\n\nجميع الطائرات مزودة بقمرات قيادة زجاجية وإلكترونيات طيران متقدمة.',
 ARRAY['fleet', 'aircraft', 'plane', 'DA40', 'DA42', 'PA28', 'PA34', 'Diamond', 'Piper'],
 ARRAY['أسطول', 'طائرة', 'طائرات'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000004',
 'What simulators does QAA have?',
 'ما هي أجهزة المحاكاة المتوفرة في الأكاديمية؟',
 E'QAA''s simulator center includes:\n\n- A320 FFTX Fixed Base Simulator — EASA-certified, for Airbus A320 type-specific training (cornerstone of Qatar Airways narrow-body fleet)\n- Procedural Trainers — For cockpit layout and system interaction familiarization\n- SE & ME Synthetic Devices — Single-engine and multi-engine simulators for initial flight training phases\n\nStudents practice maneuvers and emergency procedures in a safe, controlled environment before flying real aircraft.',
 E'يشمل مركز المحاكاة في الأكاديمية:\n\n- محاكي A320 FFTX الثابت — معتمد من EASA، للتدريب النوعي على إيرباص A320\n- المدربات الإجرائية — للتعرف على تخطيط قمرة القيادة وتفاعل الأنظمة\n- أجهزة المحاكاة SE و ME — محاكيات محرك واحد ومحركين للمراحل الأولى من التدريب',
 ARRAY['simulator', 'A320', 'FFTX', 'simulation', 'cockpit', 'trainer'],
 ARRAY['محاكاة', 'محاكي', 'قمرة القيادة'],
 'whatsapp_registration', 'manual_entry');

-- === ADMISSION & REGISTRATION ===
INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000005',
 'How do I apply to QAA?',
 'كيف أتقدم بطلب للأكاديمية؟',
 E'To apply to QAA:\n\n1. Submit your application in person at the Registration Department, Al Khulaifat, Doha\n2. QAA enforces a one application policy — you can only apply for one program at a time\n3. Pay the registration fee: QR 300 (non-refundable, covers placement test)\n4. Take the mandatory placement test\n5. After initial acceptance:\n   - Complete a medical examination (tailored to your program)\n   - Obtain security clearance (Police Clearance Certificate in Qatar)\n\nFor questions, call the Admissions Hotline: +974 4440 8873 / 4440 8858 / 4440 8869',
 E'للتقدم بطلب للأكاديمية:\n\n1. قدم طلبك شخصياً في قسم التسجيل، الخليفات، الدوحة\n2. تطبق الأكاديمية سياسة طلب واحد — يمكنك التقدم لبرنامج واحد فقط\n3. ادفع رسوم التسجيل: 300 ريال قطري (غير قابلة للاسترداد)\n4. أدِّ اختبار تحديد المستوى الإلزامي\n5. بعد القبول المبدئي:\n   - أكمل الفحص الطبي\n   - احصل على التصريح الأمني\n\nللاستفسار: +974 4440 8873 / 4440 8858 / 4440 8869',
 ARRAY['apply', 'application', 'how to apply', 'register', 'registration', 'enroll', 'join', 'process'],
 ARRAY['تقدم', 'طلب', 'تسجيل', 'انضمام'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000005',
 'What are the admission requirements?',
 'ما هي متطلبات القبول؟',
 E'General Requirements:\n- Copies of Applicant ID and Passport\n- Guardian ID (required for all students)\n- 4 passport-size photos (blue background)\n- Registration fee: QR 300 (non-refundable)\n- Mandatory placement test\n\nDomestic Applicants (Qatar-based):\n- High school diploma or equivalent\n- Minimum grade: 70% (higher for pilot training in math/science)\n- Final-year students may apply with first-semester results\n\nInternational Applicants:\n- Certified certificates from 6th, 9th, and 12th grades\n- Certificates certified by: Ministry of Education, Ministry of Foreign Affairs, and Qatari Embassy\n- Police clearance from home country\n- Personal interview required',
 E'المتطلبات العامة:\n- نسخ من بطاقة الهوية وجواز السفر\n- هوية ولي الأمر\n- 4 صور بحجم جواز السفر (خلفية زرقاء)\n- رسوم التسجيل: 300 ريال قطري\n- اختبار تحديد مستوى إلزامي\n\nالمتقدمون المحليون:\n- شهادة الثانوية العامة بمعدل 70% كحد أدنى\n\nالمتقدمون الدوليون:\n- شهادات معتمدة من الصف 6 و9 و12\n- تصديق من وزارة التعليم والخارجية والسفارة القطرية\n- شهادة خلو سوابق\n- مقابلة شخصية',
 ARRAY['requirements', 'admission', 'documents', 'grades', 'minimum', 'GPA', 'high school', 'eligibility'],
 ARRAY['متطلبات', 'قبول', 'وثائق', 'درجات', 'ثانوية'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000005',
 'What is the registration fee?',
 'ما هي رسوم التسجيل؟',
 'The registration fee is QR 300 (Qatari Riyals). This fee is non-refundable and covers the cost of the mandatory placement test. Payment is made when submitting your application in person at the Registration Department.',
 'رسوم التسجيل هي 300 ريال قطري. هذه الرسوم غير قابلة للاسترداد وتغطي تكلفة اختبار تحديد المستوى الإلزامي. يتم الدفع عند تقديم الطلب شخصياً في قسم التسجيل.',
 ARRAY['fee', 'fees', 'cost', 'price', 'payment', 'QR 300', 'registration fee', 'tuition'],
 ARRAY['رسوم', 'تكلفة', 'سعر', 'دفع'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000005',
 'What medical examination is required?',
 'ما هو الفحص الطبي المطلوب؟',
 E'After initial acceptance, a medical examination is required tailored to your chosen specialization:\n\n- Pilot candidates: Class I Medical examination (most stringent)\n- Air Traffic Controllers: Class III Medical examination\n- Engineers and other programs: Standard aviation medical\n\nThe academy issues a formal Medical Examination Request that you take to an approved medical center. You must also obtain a Police Clearance Certificate within the State of Qatar.',
 E'بعد القبول المبدئي، يُطلب فحص طبي حسب التخصص المختار:\n\n- مرشحو الطيران: فحص طبي من الفئة الأولى (الأكثر صرامة)\n- مراقبو الحركة الجوية: فحص طبي من الفئة الثالثة\n- المهندسون وبرامج أخرى: فحص طبي قياسي للطيران\n\nتصدر الأكاديمية طلب فحص طبي رسمي.',
 ARRAY['medical', 'examination', 'health', 'fitness', 'Class I', 'doctor', 'clearance'],
 ARRAY['طبي', 'فحص', 'صحة', 'طبيب'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000005',
 'Can international students apply?',
 'هل يمكن للطلاب الدوليين التقدم؟',
 E'Yes, QAA welcomes international students. The additional requirements include:\n\n1. Certified certificates from 6th, 9th, and 12th grades, certified by:\n   - Ministry of Education in your home country\n   - Ministry of Foreign Affairs in your home country\n   - Qatari Embassy in your home country\n2. Police clearance certificate from your home country (mandatory)\n3. Personal interview to assess communication skills and commitment\n\nThe academy facilitates student visa sponsorship for accepted international candidates.',
 E'نعم، ترحب الأكاديمية بالطلاب الدوليين. المتطلبات الإضافية تشمل:\n\n1. شهادات معتمدة من الصف 6 و9 و12، مصدقة من:\n   - وزارة التعليم في بلدك\n   - وزارة الخارجية في بلدك\n   - السفارة القطرية في بلدك\n2. شهادة خلو سوابق من بلدك\n3. مقابلة شخصية\n\nتسهل الأكاديمية كفالة تأشيرة الطالب للمقبولين.',
 ARRAY['international', 'foreign', 'abroad', 'overseas', 'visa', 'student visa', 'country'],
 ARRAY['دولي', 'أجنبي', 'خارج', 'تأشيرة'],
 'whatsapp_registration', 'manual_entry');

-- === FACULTY & CAREERS ===
INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000006',
 'What are the instructor qualifications at QAA?',
 'ما هي مؤهلات المدربين في الأكاديمية؟',
 E'QAA recruits globally and requires:\n\n- MPL Instructor: A-320 type rated, FI(A), 1,500 multi-crew hours, 1,000 hrs on aircraft >20,000 kg\n- Flight Instructor: ICAO/FAA/EASA CPL or ATPL, 1,000 instructional hours\n- Maintenance Manager: ICAO Type II AME License, 10 years industry experience\n- Dispatch Instructor: Licensed dispatcher (ICAO), 5 years operational experience\n- English Instructor: MA in TESOL or CELTA/DELTA, 5 years teaching experience\n\nAll instructors combine high-level academic qualifications with extensive real-world operational experience.',
 E'توظف الأكاديمية عالمياً وتتطلب:\n\n- مدرب MPL: مصنف A-320، 1,500 ساعة طيران متعدد الطاقم\n- مدرب طيران: CPL أو ATPL من ICAO/FAA/EASA، 1,000 ساعة تعليمية\n- مدير صيانة: رخصة AME من النوع الثاني ICAO، 10 سنوات خبرة\n- مدرب إرسال: مرسل مرخص (ICAO)، 5 سنوات خبرة تشغيلية\n- مدرب إنجليزي: ماجستير TESOL أو CELTA/DELTA، 5 سنوات خبرة تدريس',
 ARRAY['instructor', 'teacher', 'faculty', 'qualifications', 'staff', 'careers', 'jobs', 'recruitment'],
 ARRAY['مدرب', 'معلم', 'هيئة تدريس', 'مؤهلات', 'توظيف'],
 'whatsapp_registration', 'manual_entry');

-- === CONTACT INFORMATION ===
INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000007',
 'How can I contact QAA?',
 'كيف يمكنني التواصل مع الأكاديمية؟',
 E'Qatar Aeronautical Academy Contact Information:\n\nAddress: P.O. Box 4050, Al Khulaifat Area, Doha, Qatar\nPhone (Local): +974 4440 8888\nPhone (International): +974 4440 8873\nAdmissions Hotline: +974 4440 8873 / 4440 8858 / 4440 8869\nEmail: Info@qaa.edu.qa\nEmail response time: Within 24 hours\n\nApplications must be submitted in person at the Registration Department in Al Khulaifat.',
 E'معلومات الاتصال بأكاديمية قطر للطيران:\n\nالعنوان: ص.ب. 4050، منطقة الخليفات، الدوحة، قطر\nالهاتف (محلي): +974 4440 8888\nالهاتف (دولي): +974 4440 8873\nخط القبول: +974 4440 8873 / 4440 8858 / 4440 8869\nالبريد الإلكتروني: Info@qaa.edu.qa\nوقت الرد: خلال 24 ساعة',
 ARRAY['contact', 'phone', 'email', 'address', 'call', 'reach', 'number', 'hotline'],
 ARRAY['اتصال', 'هاتف', 'بريد', 'عنوان', 'رقم'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000007',
 'What is the QAA email address?',
 'ما هو البريد الإلكتروني للأكاديمية؟',
 'The main email address is Info@qaa.edu.qa. The academy commits to responding to all email inquiries within 24 hours.',
 'البريد الإلكتروني الرئيسي هو Info@qaa.edu.qa. تلتزم الأكاديمية بالرد على جميع الاستفسارات عبر البريد الإلكتروني خلال 24 ساعة.',
 ARRAY['email', 'mail', 'Info@qaa.edu.qa'],
 ARRAY['بريد', 'إيميل'],
 'whatsapp_registration', 'manual_entry');

INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000007',
 'What is the QAA phone number?',
 'ما هو رقم هاتف الأكاديمية؟',
 E'QAA phone numbers:\n\n- Main (Local): +974 4440 8888\n- Main (International): +974 4440 8873\n- Admissions: +974 4440 8873 / 4440 8858 / 4440 8869',
 E'أرقام هاتف الأكاديمية:\n\n- الرئيسي (محلي): +974 4440 8888\n- الرئيسي (دولي): +974 4440 8873\n- القبول: +974 4440 8873 / 4440 8858 / 4440 8869',
 ARRAY['phone', 'telephone', 'number', 'call', 'hotline', '4440'],
 ARRAY['هاتف', 'رقم', 'اتصال'],
 'whatsapp_registration', 'manual_entry');

-- === QATAR VISION 2030 ===
INSERT INTO kb_entries (id, category_id, question_en, question_ar, answer_en, answer_ar, keywords_en, keywords_ar, channel, source) VALUES
(gen_random_uuid(), '10000000-0000-0000-0000-000000000008',
 'How does QAA align with Qatar National Vision 2030?',
 'كيف تتوافق الأكاديمية مع رؤية قطر الوطنية 2030؟',
 E'QAA is a strategic asset aligned with Qatar National Vision 2030 in four key areas:\n\n1. Human Capital Development — Addresses the "Human Development" pillar by creating high-value professional opportunities for Qatari nationals in aviation\n2. Economic Diversification — Supports Qatar''s non-hydrocarbon economy by providing skilled workforce for Qatar Airways and QCAA, and attracting international students\n3. Technological Leadership — State-of-the-art facilities (A320 simulator, modern fleet < 7 years old) keep Qatar at the forefront of aviation technology\n4. Regulatory & Safety Excellence — Adheres to ICAO, EASA, and FAA standards, ensuring globally recognized graduates',
 E'تعتبر الأكاديمية أصلاً استراتيجياً يتوافق مع رؤية قطر 2030 في أربعة مجالات:\n\n1. تنمية رأس المال البشري — توفير فرص مهنية للمواطنين القطريين في الطيران\n2. التنويع الاقتصادي — دعم اقتصاد قطر غير النفطي\n3. الريادة التكنولوجية — مرافق حديثة وأسطول عمره أقل من 7 سنوات\n4. التميز التنظيمي والسلامة — الالتزام بمعايير ICAO و EASA و FAA',
 ARRAY['vision 2030', 'national vision', 'Qatar 2030', 'strategic', 'development', 'future'],
 ARRAY['رؤية 2030', 'رؤية وطنية', 'استراتيجي', 'تنمية', 'مستقبل'],
 'whatsapp_registration', 'manual_entry');
