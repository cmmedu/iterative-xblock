import json
import pkg_resources
from xblock.core import XBlock
from django.template.context import Context
from xblock.fields import Integer, String, Scope, Boolean, Float, Dict
from xblockutils.resources import ResourceLoader
from xblock.fragment import Fragment
import datetime

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
        help="Title of this activity."
    )

    style = String(
        default="base",
        values=["base", "redfid"],
        scope=Scope.settings,
        help="Style of this block."
    )

    n_columns = Integer(
        default=1,
        scope=Scope.settings,
        help="Number of columns of this activity."
    )

    no_answer_message = String(
        default="You have not answered this question yet.",
        scope=Scope.settings,
        help="Message to be shown to the user when a question has not been answered yet."
    )

    enable_download = Boolean(
        default=False,
        scope=Scope.settings,
        help="Wether to shown the download buttons or not."
    )

    content = Dict(
        default={},
        scope=Scope.settings,
        help="Content of this XBlock: texts, questions and references."
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
    

    def clear_student_state(self, user_id, course_id, item_id, requesting_user_id):
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        from common.djangoapps.student.models import user_by_anonymous_id
        id_xblock = str(self.location).split('@')[-1]
        id_student = user_by_anonymous_id(user_id).id
        for id_question in [x.id_question for x in self.content.values()]:
            if id_question is not None:
                question = IterativeXBlockQuestion.objects.get(id_course=course_id, id_xblock=id_xblock, id_question=id_question)
                answers = IterativeXBlockAnswer.objects.filter(question=question, id_student=id_student)
                for answer in answers:
                    answer.delete()


    def studio_post_duplicate(self, store, source_item):
        # pendiente
        from .models import IAAActivity, IAAStage
        if source_item.block_type == "full":
            item = IAAActivity.objects.last()
            random = item.id + 1
            new_name = source_item.activity_name + "_copy{}".format(str(random + 1))
            self.activity_name = new_name
            self.activity_stage = "1"
            new_activity = IAAActivity.objects.create(id_course=self.course_id, activity_name=self.activity_name)
            new_stage = IAAStage.objects.create(activity=new_activity, stage_label=self.stage_label, stage_number=self.activity_stage)
        return True


    def student_view(self, context={}):
        if getattr(self.runtime, 'user_is_staff', False):
            return self.instructor_view(self, context)
        else:
            return self.learner_view(self, context)


    def learner_view(self, context={}):
        id_student = self.scope_ids.user_id
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1]
        }
        template = loader.render_django_template(
            'public/html/iterativexblock_student.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
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
                "location": str(self.location).split('@')[-1],
                "user_id": id_student,
                "title": self.title, 
            }
        )
        return frag
    

    def instructor_view(self, context={}):
        from django.contrib.auth.models import User
        id_student = self.scope_ids.user_id
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1]
        }
        template = loader.render_django_template(
            'public/html/iterativexblock_student.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
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
                "location": str(self.location).split('@')[-1],
                "user_id": id_student,
                "title": self.title, 
            }
        )
        return frag


    def studio_view(self, context):
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1]
        }
        template = loader.render_django_template(
            'public/html/iterativexblock_studio.html',
            context=Context(context),
            i18n_service=self.runtime.service(self, 'i18n'),
        )
        frag = self.build_fragment(
            template,
            initialize_js_func='IterativeXBlockStudio',
            additional_js=[
                'public/js/iterativexblock_studio.js',
            ],
        )
        return frag


    def author_view(self, context={}):
        context = {
            "title": self.title,
            'location': str(self.location).split('@')[-1]
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
                'public/css/iterativexblock.css',
            ],
            additional_js=[
                'public/js/iterativexblock_author.js',
            ],
        )
        return frag
    

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        id_course = self.course_id
        id_xblock = str(self.location).split('@')[-1]
        self.content = data.get('content')
        existing_question_ids = [x.id_question for x in IterativeXBlockQuestion.objects.filter(id_course=id_course, id_xblock__ne=id_xblock).all()]
        new_question_ids = [x.id_question for x in self.content.values()]
        if bool(set(new_question_ids) & set(existing_question_ids)):
            self.content = {}
            return {'result': 'failed', 'error': 102}
        if not self.configured:
            for question in self.content.values():
                if question.id_question is not None:
                    new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=id_xblock, id_question=question.id_question)
                    new_question.save()
            self.configured = True
        else:
            new_questions = list(set(new_question_ids) - set(existing_question_ids))
            deleted_questions = list(set(existing_question_ids) - set(new_question_ids))
            for question in new_questions:
                new_question = IterativeXBlockQuestion(id_course=id_course, id_xblock=id_xblock, id_question=question.id_question)
                new_question.save()
            for question in deleted_questions:
                try:
                    deleted_question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_xblock=id_xblock, id_question=question.id_question)
                except IterativeXBlockQuestion.DoesNotExist:
                    continue
                deleted_answers = IterativeXBlockAnswer.objects.filter(id_course=id_course, question=deleted_question).all()
                for answer in deleted_answers:
                    answer.delete()
                deleted_question.delete()
        self.title = data.get('title')
        self.style = data.get('style')
        self.n_columns = data.get('n_columns')
        self.no_answer_message = data.get('no_answer_message')
        self.enable_download = data.get('enable_download')
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
            return {"result": 'repeated'}
        else:
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
            for answer in data["answers"]:
                try:
                    question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_xblock=id_xblock, id_question=answer["id_question"])
                except IterativeXBlockQuestion.DoesNotExist:
                    # manejar este caso
                    continue
                new_answer = IterativeXBlockAnswer(question=question, id_course=id_course, id_student=id_student, answer=answer["answer"], timestamp=submission_time)
                new_answer.save()
            return {"result": 'success'}

    
    @XBlock.json_handler
    def fetch_previous_submission(self, data, suffix=''):
        """
        Called when a student wants to see their previous submission.
        """
        from .models import IterativeXBlockQuestion, IterativeXBlockAnswer
        id_course = self.course_id
        id_xblock = str(self.location).split('@')[-1]
        id_student = self.scope_ids.user_id
        id_question = data["id_question"]
        try:
            question = IterativeXBlockQuestion.objects.get(id_course=id_course, id_xblock=id_xblock, id_question=id_question)
        except IterativeXBlockQuestion.DoesNotExist:
            return {"result": 'failed', 'error': 501}
        try:
            answer = IterativeXBlockAnswer.objects.get(id_course=id_course, question=question, id_student=id_student)
        except IterativeXBlockAnswer.DoesNotExist:
            return {"result": 'failed', 'error': 502}
        return {"result": 'success', 'answer': answer.answer, 'answer_time': str(answer.timestamp)}
