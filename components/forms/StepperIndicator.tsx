interface StepperIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const StepperIndicator = ({ currentStep, totalSteps }: StepperIndicatorProps) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isActive = currentStep >= step;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isActive ? 'bg-[var(--color-main)] text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step}
            </div>
            {step < totalSteps && (
              <div className={`w-8 h-1 ${currentStep > step ? 'bg-[var(--color-main)]' : 'bg-gray-200'}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

