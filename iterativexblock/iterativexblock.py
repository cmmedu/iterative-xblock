import copy
import datetime
from django.template.context import Context
import json
import pkg_resources
import re
from xblock.core import XBlock
from xblock.fields import String, Scope, Boolean, Float, Dict
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

    submit_message = String(
        default="Enviar",
        scope=Scope.settings,
        help="Text to be displayed on the submit button."
    )

    grid_structure = String(
        default=json.dumps({
            "grid": [
                ["" for i in range(10)] for j in range(10)
            ],
            "content": {}
        }),
        scope=Scope.settings,
        help="Content of this XBlock: texts, questions, iframes, and references to previous answers."
    )

    enable_download = Boolean(
        default=False,
        scope=Scope.settings,
        help="Allows for the downloading of the XBlock content as a PDF document. This functionality is only enabled if there are no questions within the module."
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
        from .compatibility import adapt_content
        ids = []
        if "n_rows" in json.loads(self.grid_structure).keys():
            for cell in adapt_content(json.loads(self.grid_structure))["content"].values():
                if cell["type"] == type:
                    ids.append(cell["content"])
        else:
            for cell in json.loads(self.grid_structure)["content"].values():
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
                question = IterativeXBlockQuestion.objects.filter(id_course=course_id, id_xblock=id_xblock, id_question=id_question).first()
                if question is None:
                    continue
                answers = IterativeXBlockAnswer.objects.filter(question=question, id_student=id_student)
                for answer in answers:
                    answer.delete()
        self.score = 0.0
        self.student_answers = {}


    def studio_post_duplicate(self, store, source_item):
        from .models import IterativeXBlockQuestion
        from .compatibility import adapt_content
        id_course = self.course_id
        id_xblock = str(self.location).split('@')[-1]
        new_content = copy.deepcopy(adapt_content(json.loads(source_item.grid_structure)))

        for cell_id, cell_value in new_content["content"].items():
            if cell_value["type"] == "question":
                id_question = cell_value["content"]
                match = re.search(r'_(\d+)$', id_question)
                if match:
                    base_question = id_question[:match.start()]
                    num = int(match.group(1)) + 1
                else:
                    base_question = id_question
                    num = 1

                # Generate unique question ID
                new_question_id = f"{base_question}_{num}"
                while IterativeXBlockQuestion.objects.filter(id_course=id_course, id_question=new_question_id).exists():
                    num += 1
                    new_question_id = f"{base_question}_{num}"

                # Save new question to the database
                new_question = IterativeXBlockQuestion(
                    id_course=id_course, 
                    id_xblock=id_xblock, 
                    id_question=new_question_id
                )
                new_question.save()

                # Update the content dictionary
                cell_value["content"] = new_question_id

        # Save the updated content
        self.grid_structure = json.dumps(new_content)
        store.update_item(self, None)
        return True


    def student_view(self, context={}):
        if getattr(self.runtime, 'user_is_staff', True):
            return self.instructor_view(context)
        else:
            return self.learner_view(context)


    def learner_view(self, context={}):
        from .compatibility import adapt_content
        id_student = self.scope_ids.user_id
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1],
            'configured': self.configured,
            'content': adapt_content(json.loads(self.grid_structure)),
            'submit_message': self.submit_message,
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
                    question = IterativeXBlockQuestion.objects.filter(id_course=id_course, id_xblock=id_xblock, id_question=id_question).first()
                    if question is None:
                        continue
                    answer = IterativeXBlockAnswer.objects.filter(id_course=id_course, question=question, id_student=id_student).first()
                    if answer is None:
                        answers[id_question] = ""
                        continue
                    answers[id_question] = answer.answer
                completed =  True
        context["indicator_class"] = self.get_indicator_class()
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeXBlockStudent',
            additional_css=[
                'public/css/iterativexblock.css'
            ],
            additional_js=[
                'public/js/iterativexblock_student.js'
            ],
            settings={
                "answers": answers,
                "completed": completed,
                "indicator_class": self.get_indicator_class(),
                "content": adapt_content(json.loads(self.grid_structure)),
                "title": self.title,
                "location": str(self.location).split('@')[-1],
                "submit_message": self.submit_message
            }
        )
        frag.add_javascript_url("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js")
        return frag
    

    def instructor_view(self, context={}):
        from django.contrib.auth.models import User
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        from .compatibility import adapt_content
        if len(self.get_ids("question")) == 0 and len(self.get_ids("answer")) == 0:
            show_student_select = False
            answers = []
        else:
            show_student_select = True
            students = User.objects.filter(courseenrollment__course_id=self.course_id,courseenrollment__is_active=1).order_by('id').values('id', 'username', 'first_name', 'last_name', 'email')
            answers = []
            for student in students:
                id_student = student['id']
                answers_student = {}
                for id_question in self.get_ids("question"):
                    question = IterativeXBlockQuestion.objects.filter(id_course=self.course_id, id_xblock=str(self.location).split('@')[-1], id_question=id_question).first()
                    if question is None:
                        # handle case
                        continue
                    answer = IterativeXBlockAnswer.objects.filter(id_course=self.course_id, question=question, id_student=id_student).first()
                    if answer is None:
                        answers_student[id_question] = ""
                        continue
                    answers_student[id_question] = answer.answer
                answers.append({
                    "id_student": id_student,
                    "username": student['username'],
                    "first_name": student['first_name'],
                    "last_name": student['last_name'],
                    "email": student['email'],
                    "answers": answers_student
                })
            answers.sort(key=lambda x: x['username'])
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1],
            'configured': self.configured,
            'content': adapt_content(json.loads(self.grid_structure)),
            'enable_download': self.enable_download,
            'answers': answers,
            'show_student_select': show_student_select
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
                'public/css/iterativexblock.css'
            ],
            additional_js=[
                'public/js/iterativexblock_instructor.js'
            ],
            settings={
                "answers": answers,
                "content": adapt_content(json.loads(self.grid_structure)),
                "title": self.title,
                "location": str(self.location).split('@')[-1],
                "submit_message": self.submit_message
            }
        )
        frag.add_javascript_url("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js")
        return frag


    def studio_view(self, context):
        from .compatibility import adapt_content
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
                "content": adapt_content(json.loads(self.grid_structure)),
                "configured": self.configured,
                "title": self.title,
                "submit_message": self.submit_message,
                'enable_download': "yes" if self.enable_download else "no"
            }
        )
        return frag


    def author_view(self, context={}):
        from .compatibility import adapt_content
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1],
            'configured': self.configured,
            "content": adapt_content(json.loads(self.grid_structure))
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
                'public/css/iterativexblock.css'
            ],
            additional_js=[
                'public/js/iterativexblock_author.js',
            ],
            settings={
                "location": str(self.location).split('@')[-1]
            }
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
            for cell_id, cell_value in content["content"].items():
                if cell_value["type"] == "question":
                    id_question = cell_value["content"]
                    new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=id_xblock, id_question=id_question)
                    new_question.save()
        else:
            new_questions = data.get('new_questions')
            deleted_questions = data.get('removed_questions')
            for question in new_questions:
                new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=id_xblock, id_question=question)
                new_question.save()
            for question in deleted_questions:
                deleted_question = IterativeXBlockQuestion.objects.filter(id_course=id_course, id_xblock=id_xblock, id_question=question).first()
                if deleted_question is None:
                    continue
                deleted_answers = IterativeXBlockAnswer.objects.filter(id_course=id_course, question=deleted_question).all()
                for answer in deleted_answers:
                    answer.delete()
                deleted_question.delete()
        if len(content["content"].keys()) != 0:
            self.configured = True
        self.grid_structure = json.dumps(data.get('content'))
        self.submit_message = data.get('submit_message')
        self.title = data.get('title')
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
                question = IterativeXBlockQuestion.objects.filter(id_course=id_course, id_xblock=id_xblock, id_question=id_question).first()
                if question is None:
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
        question = IterativeXBlockQuestion.objects.filter(id_course=id_course, id_question=id_question).first()
        if question is None:
            return {"result": "no_question"}
        answer = IterativeXBlockAnswer.objects.filter(id_course=id_course, question=question, id_student=id_student).first()
        if answer is None:
            return {"result": 'no_answer'}
        return {"result": 'success', 'answer': answer.answer, 'answer_time': str(answer.timestamp)}


    @XBlock.json_handler
    def ensure_db_integrity(self, data, suffix=''):
        """
        Called when XBlock is rendered to check if questions exist in the database. If not, they are created.
        """
        from .models import IterativeXBlockQuestion
        from .compatibility import adapt_content
        id_course = self.course_id
        id_xblock = str(self.location).split('@')[-1]
        for cell_id, cell_value in adapt_content(json.loads(self.grid_structure))["content"].items():
            if cell_value["type"] == "question":
                id_question = cell_value["content"]
                if not IterativeXBlockQuestion.objects.filter(id_course=id_course, id_xblock=id_xblock, id_question=id_question).exists():
                    new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=id_xblock, id_question=id_question)
                    new_question.save()
        return {"result": 'success'}


    def max_score(self):
        """
        Returns the configured number of possible points for this component.
        Arguments:
            None
        Returns:
            float: The number of possible points for this component
        """
        return 1.0
