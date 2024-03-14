import datetime
from django.template.context import Context
import pkg_resources
import re
from xblock.core import XBlock
from xblock.fields import String, Scope, Boolean, Float, Dict, Integer
from xblockutils.resources import ResourceLoader
from xblock.fragment import Fragment

loader = ResourceLoader(__name__)

_ = lambda text: text

@XBlock.needs('i18n')
class IterativeXBlock(XBlock):
    """
    This XBlock allows to create open response activities whose user answers
    can be later retrieved at other instances of this XBlock.
    """

    display_name = String(
        display_name=_("Display Name"),
        help=_("Display name for this module"),
        default="Iterative XBlock",
        scope=Scope.settings,
    )

    configured = Boolean(
        default=False,
        scope=Scope.settings,
        help="Wether this XBlock has been set up or not."
    )

    title = String(
        default="Iterative XBlock",
        scope=Scope.settings,
        help="Specifies the module's title. If this field is left blank, no title will be displayed."
    )

    style = String(
        default="basic",
        values=["basic", "red", "blackwhite"],
        scope=Scope.settings,
        help="Determines the module's appearance. A variety of stylesheets are available to choose from."
    )

    no_answer_message = String(
        default="You have not answered this question yet.",
        scope=Scope.settings,
        help="Message to be shown to the user when a question has not been answered yet."
    )

    submit_message = String(
        default="Submit",
        scope=Scope.settings,
        help="Message to be shown in the submit button."
    )

    submitted_message = String(
        default="Done",
        scope=Scope.settings,
        help="Message to be shown at the submit button when they have already submitted the activity."
    )

    display_message = String(
        default="Display",
        scope=Scope.settings,
        help="Message to be shown at the button to display a previous answer."
    )

    min_questions = Integer(
        default=0,
        scope=Scope.settings,
        help="Sets the minimum number of questions a student is required to answer. Setting this value to 0 mandates that all questions must be answered. This option is accessible only when at least one question is defined."
    )

    min_characters = Integer(
        default=0,
        scope=Scope.settings,
        help="Specifies the minimum character count required for an answer to be deemed valid. A setting of 0 indicates no minimum requirement."
    )

    min_words = Integer(
        default=0,
        scope=Scope.settings,
        help="Specifies the minimum word count required for an answer to be deemed valid. A setting of 0 indicates no minimum requirement."
    )

    enable_download = Boolean(
        default=False,
        scope=Scope.settings,
        help="Allows for the downloading of the XBlock content as a PDF document. This functionality is only enabled if there are no questions within the module."
    )

    content = Dict(
        default={
            "n_rows": 1,
            "1": {
                "n_cells": 2,
                "1": {
                    "type": "none",
                    "content": ""
                },
                "2": {
                    "type": "none",
                    "content": ""
                }
            }
        },
        scope=Scope.settings,
        help="Content of this XBlock: texts, questions and references to previous answers."
    )

    student_answers = Dict(
        default={},
        scope=Scope.user_state,
        help="Answers given by the student."
    )

    score = Float(
        default=0.0,
        scope=Scope.user_state,
    )

    has_author_view = True

    has_score = True


    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")


    def build_fragment(
        self,
        rendered_template,
        initialize_js_func,
        additional_css=[],
        additional_js=[],
        settings={}
    ):
        """
        Creates a fragment for display.
        """
        fragment = Fragment(rendered_template)
        for item in additional_css:
            url = self.runtime.local_resource_url(self, item)
            fragment.add_css_url(url)
        for item in additional_js:
            url = self.runtime.local_resource_url(self, item)
            fragment.add_javascript_url(url)
        settings = settings
        fragment.initialize_js(initialize_js_func, json_args=settings)
        return fragment
    

    def get_ids(self, type):
        ids = []
        for i in range(self.content["n_rows"]):
            row = self.content[str(i+1)]
            for j in range(row["n_cells"]):
                cell = row[str(j+1)]
                if cell["type"] == type:
                    ids.append(cell["content"])
        return ids
    

    def destroy_questions(self):
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        id_xblock = str(self.location).split('@')[-1]
        id_course = self.course_id
        questions = IterativeXBlockQuestion.objects.filter(id_xblock=id_xblock, id_course=id_course)
        for question in questions:
            answers = IterativeXBlockAnswer.objects.filter(question=question, id_course=id_course)
            for answer in answers:
                answer.delete()
            question.delete()


    def get_indicator_class(self):
        indicator_class = 'unanswered'
        if self.score != 0:
            indicator_class = 'correct'
        return indicator_class


    def clear_student_state(self, user_id, course_id, item_id, requesting_user_id):
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        from common.djangoapps.student.models import user_by_anonymous_id
        id_xblock = str(self.location).split('@')[-1]
        if user_id == "test":
            id_student = user_id
        else:
            id_student = user_by_anonymous_id(user_id).id
        for id_question in self.get_ids("question"):
            if id_question is not None:
                question = IterativeXBlockQuestion.objects.get(id_course=course_id, id_xblock=id_xblock, id_question=id_question)
                answers = IterativeXBlockAnswer.objects.filter(question=question, id_student=id_student)
                for answer in answers:
                    answer.delete()
        self.score = 0.0
        self.student_answers = {}


    def studio_post_duplicate(self, store, source_item):
        from .models import IterativeXBlockQuestion
        id_course = self.course_id
        id_xblock = str(self.location).split('@')[-1]
        new_content = source_item.content.copy()
        for i in range(new_content["n_rows"]):
            row = str(i+1)
            for j in range(new_content[row]["n_cells"]):
                cell = new_content[row][str(j+1)]
                if cell["type"] == "question":
                    id_question = cell["content"]
                    match = re.search(r'_(\d+)$', id_question)
                    if match:
                        base_question = id_question[:match.start()]
                        num = int(match.group(1)) + 1
                    else:
                        base_question = id_question
                        num = 1
                    new_question_id = f"{base_question}_{num}"
                    while IterativeXBlockQuestion.objects.filter(id_course=id_course, id_question=new_question_id).exists():
                        num += 1
                        new_question_id = f"{base_question}_{num}"
                    new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=id_xblock, id_question=new_question_id)
                    new_question.save()
                    cell["content"] = new_question_id
        self.content = new_content
        return True


    def student_view(self, context={}):
        if getattr(self.runtime, 'user_is_staff', True):
            return self.instructor_view(context)
        else:
            return self.learner_view(context)


    def learner_view(self, context={}):
        id_student = self.scope_ids.user_id
        context = {
            "title": self.title,
            "style": self.style,
            'location': str(self.location).split('@')[-1],
            'configured': self.configured,
            'content': self.content,
            'no_answer_message': self.no_answer_message,
            'submit_message': self.submit_message,
            'submitted_message': self.submitted_message,
            'display_message': self.display_message,
            'enable_download': self.enable_download,
            'show_submit_button': len(self.get_ids("question")) > 0
        }
        template = loader.render_django_template(
            'public/html/iterativexblock_student.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        if len(self.get_ids("question")) == 0:
            self.score = 1
            self.runtime.publish(
                self,
                'grade',
                {
                    'value': 1,
                    'max_value': 1
                }
            )
            self.student_answers = {}
            answers = {}
            completed = False
        else:
            if self.score == 0.0:
                answers = {}
                completed = False
            else:
                from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
                id_course = self.course_id
                id_xblock = str(self.location).split('@')[-1]
                id_student = self.scope_ids.user_id
                answers = {}
                for id_question in self.get_ids("question"):
                    try:
                        question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_xblock=id_xblock, id_question=id_question)
                    except IterativeXBlockQuestion.DoesNotExist:
                        continue
                    try:
                        answer = IterativeXBlockAnswer.objects.get(id_course=id_course, question=question, id_student=id_student)
                    except IterativeXBlockAnswer.DoesNotExist:
                        answers[id_question] = ""
                        continue
                    answers[id_question] = answer.answer
                completed =  True
        context["indicator_class"] = self.get_indicator_class()
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeXBlockStudent',
            additional_css=[
                'public/css/iterativexblock_{}.css'.format(self.style),
            ],
            additional_js=[
                'public/js/iterativexblock_student.js',
            ],
            settings={
                "no_answer_message": self.no_answer_message,
                "min_questions": self.min_questions,
                "min_characters": self.min_characters,
                "min_words": self.min_words,
                "answers": answers,
                "completed": completed,
                "indicator_class": self.get_indicator_class(),
                "content": self.content,
                "title": self.title
            }
        )
        frag.add_javascript_url("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
        return frag
    

    def instructor_view(self, context={}):
        from django.contrib.auth.models import User
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        id_instructor = self.scope_ids.user_id
        if len(self.get_ids("question")) == 0 and len(self.get_ids("answer")) == 0 and not self.enable_download:
            show_student_select = False
            answers = []
        else:
            show_student_select = True
            students = User.objects.filter(courseenrollment__course_id=self.course_id,courseenrollment__is_active=1).order_by('id').values('id' ,'first_name', 'last_name', 'email')
            answers = []
            for student in students:
                id_student = student['id']
                answers_student = {}
                for id_question in self.get_ids("question"):
                    try:
                        question = IterativeXBlockQuestion.objects.get(id_course=self.course_id, id_xblock=str(self.location).split('@')[-1], id_question=id_question)
                    except IterativeXBlockQuestion.DoesNotExist:
                        # handle case
                        continue
                    try:
                        answer = IterativeXBlockAnswer.objects.get(id_course=self.course_id, question=question, id_student=id_student)
                        answers_student[id_question] = answer.answer
                    except IterativeXBlockAnswer.DoesNotExist:
                        answers_student[id_question] = ""
                answers.append({
                    "id_student": id_student,
                    "first_name": student['first_name'],
                    "last_name": student['last_name'],
                    "email": student['email'],
                    "answers": answers_student
                })
            answers.sort(key=lambda x: x['last_name'])
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1],
            'configured': self.configured,
            'content': self.content,
            'style': self.style,
            'no_answer_message': self.no_answer_message,
            'answers': answers,
            'show_student_select': show_student_select,
            'enable_download': self.enable_download
        }
        template = loader.render_django_template(
            'public/html/iterativexblock_instructor.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeXBlockInstructor',
            additional_css=[
                'public/css/iterativexblock_{}.css'.format(self.style),
            ],
            additional_js=[
                'public/js/iterativexblock_instructor.js'
            ],
            settings={
                "no_answer_message": self.no_answer_message,
                "answers": answers,
                "content": self.content,
                "title": self.title,
            }
        )
        frag.add_javascript_url("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
        return frag


    def studio_view(self, context):
        context = {}
        template = loader.render_django_template(
            'public/html/iterativexblock_studio.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeXBlockStudio',
            additional_css=[
                'public/css/iterativexblock.css',
            ],
            additional_js=[
                'public/js/iterativexblock_studio.js',
            ],
            settings={
                "content": self.content,
                "title": self.title,
                "style": self.style,
                "no_answer_message": self.no_answer_message,
                "submit_message": self.submit_message,
                "submitted_message": self.submitted_message,
                "display_message": self.display_message,
                "enable_download": self.enable_download,
                "min_questions": self.min_questions,
                "min_characters": self.min_characters,
                "min_words": self.min_words
            }
        )
        return frag


    def author_view(self, context={}):
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1],
            'configured': self.configured,
            "content": self.content,
            "style": self.style
        }
        template = loader.render_django_template(
            'public/html/iterativexblock_author.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeXBlockAuthor',
            additional_css=[
                'public/css/iterativexblock_{}.css'.format(self.style),
            ],
            additional_js=[
                'public/js/iterativexblock_author.js',
            ]
        )
        return frag


    @XBlock.json_handler
    def check_question_ids(self, data, suffix=''):
        from .models import IterativeXBlockQuestion
        id_course = self.course_id
        id_xblock = str(self.location).split('@')[-1]
        existing_question_ids = [x.id_question for x in IterativeXBlockQuestion.objects.filter(id_course=id_course).exclude(id_xblock=id_xblock).all()]
        if bool(set(data) & set(existing_question_ids)):
            return {'result': 'failed', 'existing_question_ids': existing_question_ids}
        else:
            return {'result': 'success'}


    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        id_course = self.course_id
        id_xblock = str(self.location).split('@')[-1]
        content = data.get('content')
        existing_question_ids = [x.id_question for x in IterativeXBlockQuestion.objects.filter(id_course=id_course).exclude(id_xblock=id_xblock).all()]
        new_question_ids = data.get('new_questions')
        if bool(set(new_question_ids) & set(existing_question_ids)):
            return {'result': 'failed', 'error': 102}
        if not self.configured:
            for i in range(content["n_rows"]):
                row = content[str(i+1)]
                for j in range(row["n_cells"]):
                    cell = row[str(j+1)]
                    if cell["type"] == "question":
                        id_question = cell["content"]
                        new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=id_xblock, id_question=id_question)
                        new_question.save()
            self.configured = True
        else:
            new_questions = data.get('new_questions')
            deleted_questions = data.get('removed_questions')
            for question in new_questions:
                new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=id_xblock, id_question=question)
                new_question.save()
            for question in deleted_questions:
                try:
                    deleted_question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_xblock=id_xblock, id_question=question)
                except IterativeXBlockQuestion.DoesNotExist:
                    continue
                deleted_answers = IterativeXBlockAnswer.objects.filter(id_course=id_course, question=deleted_question).all()
                for answer in deleted_answers:
                    answer.delete()
                deleted_question.delete()
        self.content = data.get('content')
        self.title = data.get('title')
        self.style = data.get('style')
        self.no_answer_message = data.get('no_answer_message')
        self.submit_message = data.get('submit_message')
        self.submitted_message = data.get('submitted_message')
        self.display_message = data.get('display_message')
        self.min_questions = data.get('min_questions')
        self.min_characters = data.get('min_characters')
        self.min_words = data.get('min_words')
        self.enable_download = data.get('enable_download') == "yes"
        return {'result': 'success'}


    @XBlock.json_handler
    def student_submit(self, data, suffix=''):
        """
        Called when a student submits an answer to this XBlock.
        """
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        id_course = self.course_id
        id_xblock = str(self.location).split('@')[-1]
        id_student = self.scope_ids.user_id
        if self.score != 0.0:
            return {"result": 'repeated', 'indicator_class': self.get_indicator_class()}
        else:
            self.student_answers = data
            answered = 0
            for id_question, answer in data.items():
                if answer != "":
                    answered += 1
            if self.min_questions > 0 and answered < self.min_questions:
                return {"result": 'not_enough', 'indicator_class': self.get_indicator_class()}
            if self.min_questions == 0:
                if answered < len(self.get_ids("question")):
                    return {"result": 'not_enough', 'indicator_class': self.get_indicator_class()}
            self.score = 1
            self.runtime.publish(
                self,
                'grade',
                {
                    'value': 1,
                    'max_value': 1
                }
            )
            submission_time = datetime.datetime.now()
            for id_question, answer in data.items():
                try:
                    question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_xblock=id_xblock, id_question=id_question)
                except IterativeXBlockQuestion.DoesNotExist:
                    # manejar este caso
                    continue
                new_answer = IterativeXBlockAnswer(question=question, id_course=id_course, id_student=id_student, answer=answer, timestamp=submission_time)
                new_answer.save()
            return {"result": 'success', 'indicator_class': self.get_indicator_class()}

    
    @XBlock.json_handler
    def fetch_previous_submission(self, data, suffix=''):
        """
        Called when a student wants to see their previous submission.
        """
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        id_course = self.course_id
        id_student_data = data["id_user"]
        if id_student_data != "":
            id_student = id_student_data
        else:
            id_student = self.scope_ids.user_id
        id_question = data["id_question"]
        try:
            question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_question=id_question)
        except IterativeXBlockQuestion.DoesNotExist:
            return {"result": "no_question"}
        try:
            answer = IterativeXBlockAnswer.objects.get(id_course=id_course, question=question, id_student=id_student)
        except IterativeXBlockAnswer.DoesNotExist:
            return {"result": 'no_answer'}
        return {"result": 'success', 'answer': answer.answer, 'answer_time': str(answer.timestamp)}


    @XBlock.json_handler
    def fetch_pdf_submissions(self, data, suffix=''):
        """
        Called when a user wants to download the submissions as a PDF file.
        """
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        id_course = self.course_id
        id_student_data = data["id_user"]
        if id_student_data != "":
            id_student = id_student_data
        else:
            id_student = self.scope_ids.user_id
        questions = self.get_ids("answer")
        answers = {}
        for question in questions:
            try:
                question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_question=question)
            except IterativeXBlockQuestion.DoesNotExist:
                answers[question] = "This question does not exist."
            try:
                answer = IterativeXBlockAnswer.objects.get(id_course=id_course, question=question, id_student=id_student)
            except IterativeXBlockAnswer.DoesNotExist:
                answers[question] = self.no_answer_message
            answers[question] = answer.answer
        return {"result": 'success', 'answers': answers}

