from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='IterativeXBlockQuestion',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('id_xblock', models.TextField()),
                ('id_course', models.TextField()),
                ('id_question', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='IterativeXBlockAnswer',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('id_course', models.TextField()),
                ('id_student', models.TextField()),
                ('answer', models.TextField()),
                ('timestamp', models.DateField()),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='iterativexblock_question', to='iterativexblock.iterativexblockquestion')),
            ],
        ),
    ]
