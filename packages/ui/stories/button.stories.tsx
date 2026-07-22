import type { Meta, StoryObj } from "@storybook/react";

const Button = ({ label }: { label: string }): React.ReactElement => {
  return <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">{label}</button>;
};

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    label: "Button",
  },
};