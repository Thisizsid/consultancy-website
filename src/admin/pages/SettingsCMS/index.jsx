import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock, Info, Mail, Plus, Trash2, Save } from 'lucide-react';
import { getDocument, updateDocument } from '../../../services/api';
import Card, { CardBody, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';

const settingsSchema = z.object({
  aboutUs: z.object({
    tagline: z.string().min(1, 'Required'),
    description: z.string().min(1, 'Required'),
  }),
  contactInfo: z.object({
    address: z.string().min(1, 'Required'),
    phone: z.string().min(1, 'Required'),
    email: z.string().email('Please enter a valid email'),
  }),
  officeHours: z.array(
    z.object({
      days: z.string().min(1, 'Required'),
      hours: z.string().min(1, 'Required'),
      closed: z.boolean(),
    })
  ),
});

const SettingsCMS = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useUiStore();

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      aboutUs: { tagline: '', description: '' },
      contactInfo: { address: '', phone: '', email: '' },
      officeHours: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'officeHours' });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settings = await getDocument('settings', 'site_settings');
        reset({
          aboutUs: settings.aboutUs || { tagline: '', description: '' },
          contactInfo: settings.contactInfo || { address: '', phone: '', email: '' },
          officeHours: settings.officeHours || [],
        });
      } catch (err) {
        showToast('Error fetching site settings.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, showToast]);

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      await updateDocument('settings', 'site_settings', formData);
      showToast('Site settings updated.', 'success');
    } catch (err) {
      showToast('Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <Clock className="w-6 h-6 text-secondary" /> Site Settings
        </h1>
        <p className="text-xs text-text-secondary">Manage the About Us blurb, contact details, and office hours shown in the public site footer.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Info className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-text-primary text-sm">About Us (Footer)</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Tagline"
                placeholder="e.g. Connecting Students to Global Opportunities"
                {...register('aboutUs.tagline')}
                error={errors.aboutUs?.tagline?.message}
              />
              <Input
                label="Description"
                type="textarea"
                rows={3}
                placeholder="A short blurb about the consultancy shown in the footer."
                {...register('aboutUs.description')}
                error={errors.aboutUs?.description?.message}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-text-primary text-sm">Contact Us (Footer)</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Address"
                placeholder="e.g. 102 Premium Plaza, Parliament Road, Kathmandu, Nepal"
                {...register('contactInfo.address')}
                error={errors.contactInfo?.address?.message}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  placeholder="e.g. +977 1-4433221"
                  {...register('contactInfo.phone')}
                  error={errors.contactInfo?.phone?.message}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="e.g. info@lassoconsultancy.com"
                  {...register('contactInfo.email')}
                  error={errors.contactInfo?.email?.message}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-text-primary text-sm">Office Hours</h2>
            </CardHeader>
            <CardBody className="space-y-5">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end border border-gray-100 rounded-md p-4 bg-gray-50/50">
                  <Input
                    label="Day(s)"
                    placeholder="e.g. Sunday - Friday"
                    {...register(`officeHours.${index}.days`)}
                    error={errors.officeHours?.[index]?.days?.message}
                  />
                  <Input
                    label="Hours"
                    placeholder="e.g. 9:00 AM - 6:00 PM"
                    {...register(`officeHours.${index}.hours`)}
                    error={errors.officeHours?.[index]?.hours?.message}
                  />
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-primary pb-2.5 sm:pb-0 sm:h-[42px]">
                    <input type="checkbox" {...register(`officeHours.${index}.closed`)} className="w-4 h-4 accent-secondary" />
                    Closed
                  </label>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => remove(index)}
                    className="h-[42px]"
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => append({ days: '', hours: '', closed: false })}
              >
                Add Row
              </Button>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" icon={Save} loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsCMS;
